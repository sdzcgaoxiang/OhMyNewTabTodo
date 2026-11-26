import test from 'node:test';
import assert from 'node:assert/strict';
import { createRepository } from '../src/repository.ts';
import { createReminderService, REMINDER_STORAGE_KEY } from '../src/reminders.ts';
import { emptyState } from '../src/model.ts';
import { exportFull } from '../src/transfer.ts';
import type { AppState, Card } from '../src/types.ts';

function setup() {
  let clock = new Date(2026, 10, 4, 8);
  const values: Record<string, unknown> = {};
  const area = {
    fail: false,
    async get(key: string) {
      return { [key]: structuredClone(values[key]) };
    },
    async set(items: Record<string, unknown>) {
      if (this.fail && Object.hasOwn(items, REMINDER_STORAGE_KEY))
        throw new Error('storage failed');
      Object.assign(values, structuredClone(items));
    },
  };
  const repository = createRepository(area);
  const shown: Array<{ id: string; title: string; language: string }> = [];
  const platform = {
    fail: false,
    next: null as number | null,
    async schedule(next: number | null) {
      this.next = next;
    },
    async show(id: string, card: Card, state: AppState) {
      if (this.fail) throw new Error('notifications denied');
      shown.push({ id, title: card.title, language: state.language });
    },
  };
  const restart = () =>
    createReminderService({ repository: createRepository(area), area, platform, now: () => clock });
  const service = restart();
  async function add(id = 'c', dueDate = '2026-11-04', dueTime = '') {
    if (!(await repository.read()).data.boards.b)
      await service.dispatch({ type: 'board.add', id: 'b', title: 'B' });
    return service.dispatch({
      type: 'card.add',
      id,
      boardId: 'b',
      card: { title: id, dueDate, dueTime },
    });
  }
  return {
    area,
    values,
    repository,
    platform,
    shown,
    service,
    restart,
    add,
    at: (value: Date) => {
      clock = value;
    },
  };
}

test('all-day reminder is scheduled at 09:00 and sent once across concurrent events and restart', async () => {
  const h = setup();
  const before = await h.add();
  assert.equal(h.shown.length, 0);
  assert.equal(h.platform.next, new Date(2026, 10, 4, 9).getTime());
  h.at(new Date(2026, 10, 4, 9));
  await Promise.all([h.service.sync(), h.service.sync(), h.service.sync()]);
  assert.equal(h.shown.length, 1);
  await h.restart().sync();
  assert.equal(h.shown.length, 1);
  assert.equal(h.platform.next, null);
  assert.deepEqual(await h.repository.read(), before);
  assert.equal(Object.hasOwn(exportFull(before).state, REMINDER_STORAGE_KEY), false);
});

test('timed reminders ignore all-day toggle; title and language changes do not rearm a delivered schedule', async () => {
  const h = setup();
  await h.service.dispatch({ type: 'options.patch', patch: { allDayReminders: false } });
  await h.add('c', '2026-11-04', '10:30');
  h.at(new Date(2026, 10, 4, 10, 30));
  await h.service.dispatch({ type: 'language', language: 'zh-CN' });
  assert.equal(h.shown[0].language, 'zh-CN');
  await h.service.dispatch({ type: 'card.update', id: 'c', patch: { title: 'Renamed' } });
  await h.service.dispatch({ type: 'card.move', id: 'c', boardId: 'b', index: 0 });
  assert.equal(h.shown.length, 1);
  await h.service.dispatch({ type: 'card.update', id: 'c', patch: { dueTime: '11:00' } });
  h.at(new Date(2026, 10, 4, 11));
  await h.service.sync();
  assert.equal(h.shown.length, 2);
  assert.equal(h.shown[1].title, 'Renamed');
});

test('completion, deletion, clearing and orphaning cancel pending reminders', async () => {
  for (const action of ['complete', 'delete', 'clear', 'board', 'orphan']) {
    const h = setup();
    await h.add();
    if (action === 'complete') await h.service.dispatch({ type: 'card.toggle', id: 'c' });
    if (action === 'delete') await h.service.dispatch({ type: 'card.delete', id: 'c' });
    if (action === 'clear')
      await h.service.dispatch({
        type: 'card.update',
        id: 'c',
        patch: { dueDate: '', dueTime: '' },
      });
    if (action === 'board') await h.service.dispatch({ type: 'board.delete', id: 'b' });
    if (action === 'orphan') {
      const state = await h.repository.read();
      state.data.boards.b.cardIds = [];
      await h.area.set({ app_state: state });
    }
    h.at(new Date(2026, 10, 4, 9));
    await h.service.sync();
    assert.equal(h.shown.length, 0, action);
    assert.equal(h.platform.next, null, action);
  }
});

test('hidden boards still remind; reopening completed tasks does not repeat delivered reminders', async () => {
  const h = setup();
  await h.add();
  await h.service.dispatch({ type: 'board.update', id: 'b', patch: { isHidden: true } });
  h.at(new Date(2026, 10, 4, 9));
  await h.service.sync();
  await h.service.dispatch({ type: 'card.toggle', id: 'c' });
  await h.service.dispatch({ type: 'card.toggle', id: 'c' });
  assert.equal(h.shown.length, 1);
});

test('startup skips historical backlog but catches up registered missed reminders and today tasks', async () => {
  const h = setup();
  await h.add('historical', '2020-01-01');
  assert.equal(h.shown.length, 0);
  await h.add();
  h.at(new Date(2026, 10, 6, 12));
  await h.restart().sync();
  assert.equal(h.shown.length, 1);
  assert.equal(h.shown[0].title, 'c');
  await h.add('today', '2026-11-06');
  assert.equal(h.shown.length, 2);
});

test('notification failures retry durably after restart without rejecting saved task changes', async () => {
  const h = setup();
  await h.add();
  h.at(new Date(2026, 10, 4, 9));
  h.platform.fail = true;
  const saved = await h.service.dispatch({
    type: 'card.update',
    id: 'c',
    patch: { title: 'Saved despite notification error' },
  });
  assert.equal(saved.data.cards.c.title, 'Saved despite notification error');
  assert.equal(h.shown.length, 0);
  h.platform.fail = false;
  await h.restart().sync();
  assert.equal(h.shown.length, 1);
  assert.equal(h.shown[0].title, saved.data.cards.c.title);
});

test('delivery never happens before plans are persisted and task saving survives ledger failure', async () => {
  const h = setup();
  h.at(new Date(2026, 10, 4, 10));
  h.area.fail = true;
  const state = await h.add();
  assert.ok(state.data.cards.c);
  assert.equal(h.shown.length, 0);
  h.area.fail = false;
  await h.service.sync();
  assert.equal(h.shown.length, 1);
});

test('all-day time changes reschedule pending reminders but do not repeat a delivered date', async () => {
  const h = setup();
  await h.add();
  await h.service.dispatch({ type: 'options.patch', patch: { allDayReminderTime: '10:00' } });
  assert.equal(h.platform.next, new Date(2026, 10, 4, 10).getTime());
  h.at(new Date(2026, 10, 4, 10));
  await h.service.sync();
  await h.service.dispatch({ type: 'options.patch', patch: { allDayReminderTime: '09:00' } });
  assert.equal(h.shown.length, 1);
});

test('changing device timezone recomputes pending wall-clock times without repeating delivered occurrences', async () => {
  const old = process.env.TZ;
  process.env.TZ = 'Asia/Shanghai';
  try {
    const h = setup();
    await h.add('c', '2026-11-04', '12:00');
    const first = h.platform.next;
    process.env.TZ = 'America/New_York';
    await h.service.sync();
    assert.notEqual(h.platform.next, first);
    h.at(new Date(2026, 10, 4, 12));
    await h.service.sync();
    process.env.TZ = 'Asia/Shanghai';
    await h.service.sync();
    assert.equal(h.shown.length, 1);
  } finally {
    if (old === undefined) delete process.env.TZ;
    else process.env.TZ = old;
  }
});
