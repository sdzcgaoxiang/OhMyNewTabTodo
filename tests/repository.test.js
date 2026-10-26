import test from 'node:test';
import assert from 'node:assert/strict';
import { createRepository } from '../src/repository.js';
import { legacy } from './fixtures.js';
function memory() {
  let values = {}; return {
    fail: false,
    async get(key) { return structuredClone({ [key]: values[key] }); },
    async set(data) { if (this.fail) throw new Error('QUOTA_BYTES exceeded'); values = { ...values, ...structuredClone(data) }; },
  };
}
test('concurrent operations are serialized from fresh state and survive worker restart', async () => {
  const area = memory(), repo = createRepository(area);
  await Promise.all([repo.dispatch({ type: 'board.add', id: 'a', title: 'A' }), repo.dispatch({ type: 'board.add', id: 'b', title: 'B' })]);
  const state = await createRepository(area).read();
  assert.deepEqual(state.data.boardOrder, ['a', 'b']); assert.equal(state.revision, 2);
});
test('failed write propagates and leaves previous state; queue recovers', async () => {
  const area = memory(), repo = createRepository(area); area.fail = true;
  await assert.rejects(repo.dispatch({ type: 'board.add', title: 'bad' }), /QUOTA/);
  assert.equal((await repo.read()).data.boardOrder.length, 0);
  area.fail = false; await repo.dispatch({ type: 'board.add', title: 'good' });
  assert.equal((await repo.read()).data.boardOrder.length, 1);
});
test('malformed import and stale preview never write; valid import is recoverable', async () => {
  const repo = createRepository(memory());
  await assert.rejects(repo.dispatch({ type: 'import', text: 'bad', expectedRevision: 0 }), /JSON/);
  const changed = await repo.dispatch({ type: 'board.add', id: 'local', title: '本地' });
  await assert.rejects(repo.dispatch({ type: 'import', text: JSON.stringify(legacy()), expectedRevision: 0 }), /变化|过期/);
  const imported = await repo.dispatch({ type: 'import', text: JSON.stringify(legacy()), expectedRevision: changed.revision, mode: 'replace' });
  assert.equal(Object.keys(imported.data.cards).length, 2);
  assert.equal(imported.backups.length, 1);
  const restored = await repo.dispatch({ type: 'restore', id: imported.backups[0].id, expectedRevision: imported.revision });
  assert.deepEqual(restored.data.boardOrder, ['local']);
});
test('deletion persists without resurrecting data on reload', async () => {
  const area = memory(), repo = createRepository(area);
  await repo.dispatch({ type: 'import', text: JSON.stringify(legacy()), expectedRevision: 0, mode: 'replace' });
  await repo.dispatch({ type: 'board.delete', id: 'board-a' });
  const state = await createRepository(area).read();
  assert.equal(Object.hasOwn(state.data.boards, 'board-a'), false);
  assert.equal(Object.hasOwn(state.data.cards, 'card-a'), false);
});
test('future stored schema is rejected rather than reset', async () => {
  const area = memory(); await area.set({ app_state: { schemaVersion: 99 } });
  await assert.rejects(createRepository(area).read(), /版本/);
});
test('clear preserves a bounded recovery snapshot and requires fresh revision', async () => {
  const repo = createRepository(memory());
  await repo.dispatch({ type: 'board.add', title: '保留' });
  await assert.rejects(repo.dispatch({ type: 'clear' }), /版本|预览/);
  const before = await repo.read(); const after = await repo.dispatch({ type: 'clear', expectedRevision: before.revision });
  assert.equal(after.data.boardOrder.length, 0); assert.equal(after.backups[0].state.data.boardOrder.length, 1);
});
