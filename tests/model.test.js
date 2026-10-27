import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, applyOperation } from '../src/model.js';
const board = () =>
  applyOperation(emptyState(), { type: 'board.add', id: 'board-a', title: '工作' });
const withCard = () =>
  applyOperation(board(), {
    type: 'card.add',
    id: 'card-a',
    boardId: 'board-a',
    card: { title: '事项', history: [1], createdAt: '2020', custom: true },
  });
test('editing preserves invisible metadata and does not mutate input', () => {
  const before = withCard();
  const after = applyOperation(before, {
    type: 'card.update',
    id: 'card-a',
    patch: { title: '更新' },
    expected: before.data.cards['card-a'],
  });
  assert.equal(before.data.cards['card-a'].title, '事项');
  assert.equal(after.data.cards['card-a'].createdAt, '2020');
  assert.deepEqual(after.data.cards['card-a'].history, [1]);
  assert.equal(after.data.cards['card-a'].custom, true);
});
test('stale edit rejects instead of overwriting another change', () => {
  const before = withCard();
  const after = applyOperation(before, {
    type: 'card.update',
    id: 'card-a',
    patch: { title: '他人修改' },
  });
  assert.throws(
    () =>
      applyOperation(after, {
        type: 'card.update',
        id: 'card-a',
        patch: { title: '旧页面' },
        expected: before.data.cards['card-a'],
      }),
    /冲突|已被/,
  );
});
test('delete board removes its data and cards', () => {
  const after = applyOperation(withCard(), { type: 'board.delete', id: 'board-a' });
  assert.deepEqual(after.data, { boards: {}, cards: {}, boardOrder: [] });
});
test('copy and move update references without duplicates', () => {
  let state = applyOperation(withCard(), { type: 'card.copy', id: 'card-a', newId: 'card-copy' });
  assert.deepEqual(state.data.boards['board-a'].cardIds, ['card-a', 'card-copy']);
  state = applyOperation(state, { type: 'board.add', id: 'board-b', title: '另一列' });
  state = applyOperation(state, {
    type: 'card.move',
    id: 'card-copy',
    boardId: 'board-b',
    index: 0,
  });
  assert.deepEqual(state.data.boards['board-a'].cardIds, ['card-a']);
  assert.deepEqual(state.data.boards['board-b'].cardIds, ['card-copy']);
});
test('completion toggles and hidden-complete mode moves item to bottom', () => {
  let state = applyOperation(withCard(), { type: 'card.copy', id: 'card-a', newId: 'card-b' });
  state = applyOperation(state, { type: 'options.patch', patch: { hideCompletedCards: true } });
  state = applyOperation(state, { type: 'card.toggle', id: 'card-a' });
  assert.equal(state.data.cards['card-a'].completed, true);
  assert.deepEqual(state.data.boards['board-a'].cardIds, ['card-b', 'card-a']);
});
test('empty titles and unknown mutations fail', () => {
  assert.throws(
    () => applyOperation(board(), { type: 'card.add', boardId: 'board-a', card: { title: '  ' } }),
    /标题/,
  );
  assert.throws(() => applyOperation(board(), { type: 'accidental-reset' }), /操作/);
});
test('card edit rejects a stale board assignment after another page moves it', () => {
  const before = applyOperation(withCard(), { type: 'board.add', id: 'board-b', title: '另一列' });
  const moved = applyOperation(before, { type: 'card.move', id: 'card-a', boardId: 'board-b' });
  assert.throws(
    () =>
      applyOperation(moved, {
        type: 'card.update',
        id: 'card-a',
        patch: { title: '旧页面草稿' },
        expected: before.data.cards['card-a'],
        expectedBoardId: 'board-a',
        boardId: 'board-a',
      }),
    /移动|冲突/,
  );
  assert.deepEqual(moved.data.boards['board-b'].cardIds, ['card-a']);
});
