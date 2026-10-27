import test from 'node:test';
import assert from 'node:assert/strict';
import { createRepository } from '../src/repository.ts';
import { legacy } from './fixtures.ts';
import type { RepositoryOperation } from '../src/operations.ts';
function memory() {
  let values: Record<string, unknown> = {};
  return {
    fail: false,
    async get(key: string) {
      return structuredClone({ [key]: values[key] });
    },
    async set(data: Record<string, unknown>) {
      if (this.fail) throw new Error('QUOTA_BYTES exceeded');
      values = { ...values, ...structuredClone(data) };
    },
  };
}
test('concurrent operations are serialized from fresh state and survive worker restart', async () => {
  const area = memory(),
    repo = createRepository(area);
  await Promise.all([
    repo.dispatch({ type: 'board.add', id: 'a', title: 'A' }),
    repo.dispatch({ type: 'board.add', id: 'b', title: 'B' }),
  ]);
  const state = await createRepository(area).read();
  assert.deepEqual(state.data.boardOrder, ['a', 'b']);
  assert.equal(state.revision, 2);
});
test('failed write propagates and leaves previous state; queue recovers', async () => {
  const area = memory(),
    repo = createRepository(area);
  area.fail = true;
  await assert.rejects(repo.dispatch({ type: 'board.add', title: 'bad' }), /QUOTA/);
  assert.equal((await repo.read()).data.boardOrder.length, 0);
  area.fail = false;
  await repo.dispatch({ type: 'board.add', title: 'good' });
  assert.equal((await repo.read()).data.boardOrder.length, 1);
});
test('malformed import and stale preview never write; valid import is recoverable', async () => {
  const repo = createRepository(memory());
  await assert.rejects(repo.dispatch({ type: 'import', text: 'bad', expectedRevision: 0 }), /JSON/);
  const changed = await repo.dispatch({ type: 'board.add', id: 'local', title: '本地' });
  await assert.rejects(
    repo.dispatch({ type: 'import', text: JSON.stringify(legacy()), expectedRevision: 0 }),
    /变化|过期/,
  );
  const imported = await repo.dispatch({
    type: 'import',
    text: JSON.stringify(legacy()),
    expectedRevision: changed.revision,
    mode: 'replace',
  });
  assert.equal(Object.keys(imported.data.cards).length, 2);
  assert.equal(imported.backups.length, 1);
  const restored = await repo.dispatch({
    type: 'restore',
    id: imported.backups[0].id,
    expectedRevision: imported.revision,
  });
  assert.deepEqual(restored.data.boardOrder, ['local']);
});
test('deletion persists without resurrecting data on reload', async () => {
  const area = memory(),
    repo = createRepository(area);
  await repo.dispatch({
    type: 'import',
    text: JSON.stringify(legacy()),
    expectedRevision: 0,
    mode: 'replace',
  });
  await repo.dispatch({ type: 'board.delete', id: 'board-a' });
  const state = await createRepository(area).read();
  assert.equal(Object.hasOwn(state.data.boards, 'board-a'), false);
  assert.equal(Object.hasOwn(state.data.cards, 'card-a'), false);
});
test('future stored schema is rejected rather than reset', async () => {
  const area = memory();
  await area.set({ app_state: { schemaVersion: 99 } });
  await assert.rejects(createRepository(area).read(), /版本/);
});
test('existing v0.1 app_state reads without changing revision or unknown data', async () => {
  const area = memory();
  const original = {
    ...(await createRepository(area).read()),
    revision: 17,
    custom: { nested: [null, 'preserve'] },
    data: { boards: {}, cards: {}, boardOrder: [], extra: { keep: true } },
  };
  await area.set({ app_state: original });
  const state = await createRepository(area).read();
  assert.equal(state.revision, 17);
  assert.deepEqual(state.custom, original.custom);
  assert.deepEqual(state.data.extra, original.data.extra);
});
test('stored state without required data collections rejects before edits', async () => {
  const area = memory();
  await area.set({ app_state: { schemaVersion: 1, revision: 2, data: {}, backups: [] } });
  await assert.rejects(createRepository(area).read(), /结构异常/);
});
test('clear preserves a bounded recovery snapshot and requires fresh revision', async () => {
  const repo = createRepository(memory());
  await repo.dispatch({ type: 'board.add', title: '保留' });
  // Missing preview revision intentionally bypasses the compile-time contract.
  await assert.rejects(repo.dispatch({ type: 'clear' } as RepositoryOperation), /版本|预览/);
  const before = await repo.read();
  const after = await repo.dispatch({ type: 'clear', expectedRevision: before.revision });
  assert.equal(after.data.boardOrder.length, 0);
  assert.equal(after.backups[0].state.data.boardOrder.length, 1);
});
test('merging independently valid files cannot attach one card to two boards', async () => {
  const repo = createRepository(memory());
  const a = {
    boardOrder: ['a'],
    boards: { a: { id: 'a', title: 'A', cardIds: ['c'] } },
    cards: { c: { id: 'c', title: 'Shared' } },
  };
  const b = { ...a, boardOrder: ['b'], boards: { b: { id: 'b', title: 'B', cardIds: ['c'] } } };
  const before = await repo.dispatch({
    type: 'import',
    text: JSON.stringify(a),
    expectedRevision: 0,
  });
  await assert.rejects(
    repo.dispatch({ type: 'import', text: JSON.stringify(b), expectedRevision: before.revision }),
    /重复引用|冲突/,
  );
  assert.deepEqual(await repo.read(), before);
});
