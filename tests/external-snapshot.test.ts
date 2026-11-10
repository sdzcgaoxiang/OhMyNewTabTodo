import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState } from '../src/model.ts';
import { legacy } from './fixtures.ts';
import { createExternalSnapshot } from '../src/external-snapshot.ts';

test('snapshot preserves boards and tasks while omitting private fields', () => {
  const state = emptyState();
  state.data = {
    ...legacy(),
    cards: { ...legacy().cards, orphan: { id: 'orphan', title: 'Orphan' } },
  };
  const before = structuredClone(state);
  const output = createExternalSnapshot(state, 'instance', '2026-11-09T00:00:00Z');
  assert.deepEqual(output.data.boardOrder, ['board-a']);
  assert.equal(output.data.boards['board-b'].isHidden, true);
  assert.equal(output.data.cards['orphan'].completed, false);
  assert.equal(output.data.cards['card-b'].dueDate, '2026-12-31');
  assert.equal('custom' in output.data.cards['card-a'], false);
  assert.equal('history' in output.data.cards['card-a'], false);
  assert.deepEqual(state, before);
});
