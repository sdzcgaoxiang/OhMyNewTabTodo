import test from 'node:test';
import assert from 'node:assert/strict';
import { applyOperation, emptyState } from '../src/model.ts';
import { createRepository, isAppState } from '../src/repository.ts';
import { exportFull, parseImport, prepareImport } from '../src/transfer.ts';

test('all-day preferences default compatibly and persist custom times without coercion', async () => {
  const old = emptyState();
  delete old.options.allDayReminders;
  const area = {
    value: old,
    async get() {
      return { app_state: structuredClone(this.value) };
    },
    async set(items: Record<string, unknown>) {
      this.value = items.app_state as typeof old;
    },
  };
  const repo = createRepository(area);
  assert.equal((await repo.read()).options.allDayReminders, true);
  const changed = await repo.dispatch({
    type: 'options.patch',
    patch: { allDayReminderTime: '08:15', allDayReminders: false },
  });
  assert.equal(changed.options.allDayReminderTime, '08:15');
  assert.equal((await createRepository(area).read()).options.allDayReminders, false);
  assert.equal(changed.revision, 1);
});

test('invalid reminder preferences reject without modifying state or unknown fields', () => {
  const state = emptyState();
  state.options.custom = { keep: true };
  for (const time of ['24:00', '9:00', '12:99', '', true]) {
    assert.throws(() =>
      applyOperation(state, {
        type: 'options.patch',
        patch: { allDayReminderTime: time } as never,
      }),
    );
    assert.equal(
      isAppState({ ...state, options: { ...state.options, allDayReminderTime: time } }),
      false,
    );
  }
  assert.equal(state.revision, 0);
  assert.deepEqual(state.options.custom, { keep: true });
});

test('full backups restore reminder preferences; merge keeps local settings; legacy defaults work', () => {
  const source = applyOperation(emptyState(), {
    type: 'options.patch',
    patch: { allDayReminderTime: '07:45', allDayReminders: false },
  });
  source.options.custom = { keep: true };
  const parsed = parseImport(JSON.stringify(exportFull(source)));
  const replaced = prepareImport(emptyState(), parsed, { mode: 'replace' });
  assert.equal(replaced.options.allDayReminderTime, '07:45');
  assert.equal(replaced.options.allDayReminders, false);
  assert.deepEqual(replaced.options.custom, { keep: true });
  assert.equal(prepareImport(emptyState(), parsed).options.allDayReminderTime, undefined);
  const old = exportFull(emptyState());
  delete old.state.options.allDayReminders;
  assert.equal(
    prepareImport(emptyState(), parseImport(JSON.stringify(old)), { mode: 'replace' }).options
      .allDayReminders,
    true,
  );
  old.state.options.allDayReminderTime = 'wrong';
  assert.throws(() => parseImport(JSON.stringify(old)), /时间|time/i);
});

test('recovery snapshots restore reminder preferences as well as cards', async () => {
  const values: Record<string, unknown> = {};
  const repo = createRepository({
    async get(key) {
      return { [key]: values[key] };
    },
    async set(items) {
      Object.assign(values, structuredClone(items));
    },
  });
  await repo.dispatch({ type: 'options.patch', patch: { allDayReminderTime: '06:30' } });
  const replaced = await repo.dispatch({
    type: 'import',
    text: JSON.stringify(exportFull(emptyState())),
    mode: 'replace',
    expectedRevision: 1,
  });
  const restored = await repo.dispatch({
    type: 'restore',
    id: replaced.backups[0].id,
    expectedRevision: replaced.revision,
  });
  assert.equal(restored.options.allDayReminderTime, '06:30');
});

test('restoring a genuinely old recovery point returns valid state before any reload', async () => {
  const legacy = emptyState();
  delete legacy.options.allDayReminders;
  legacy.options.unknownPreference = { preserve: true };
  const current = emptyState();
  current.options.allDayReminders = false;
  current.options.allDayReminderTime = '06:30';
  current.backups = [
    { id: 'old', createdAt: '2026-10-01T00:00:00Z', label: '导入前', state: legacy },
  ];
  const values: Record<string, unknown> = { app_state: current };
  const repository = createRepository({
    async get(key) {
      return { [key]: structuredClone(values[key]) };
    },
    async set(items) {
      Object.assign(values, structuredClone(items));
    },
  });
  const restored = await repository.dispatch({ type: 'restore', id: 'old', expectedRevision: 0 });
  assert.equal(isAppState(restored), true, 'response must be accepted by client immediately');
  assert.equal(
    isAppState(values.app_state),
    true,
    'storage subscriber must accept persisted state',
  );
  assert.equal(restored.options.allDayReminders, true);
  assert.equal(restored.options.allDayReminderTime, undefined);
  assert.deepEqual(restored.options.unknownPreference, { preserve: true });
});
