import assert from 'node:assert/strict';
import { test } from 'node:test';
import { boardDropIndex, cardDropIndex } from '../src/drag-position.ts';

test('same-board drop indexes follow the order after removing the dragged card', () => {
  assert.equal(cardDropIndex(['a', 'b', 'c'], ['a', 'b', 'c'], 'a', 2), 2);
  assert.equal(cardDropIndex(['a', 'b', 'c'], ['a', 'b', 'c'], 'c', 0), 0);
});

test('a card dropped in an empty board is inserted at the start', () => {
  assert.equal(cardDropIndex([], [], 'a', 0), 0);
});

test('hidden completed cards remain after visible cards when dropping at the bottom', () => {
  assert.equal(cardDropIndex(['a', 'b', 'done'], ['a', 'b'], 'a', 1), 1);
  assert.equal(cardDropIndex(['b', 'done'], ['b'], 'a', 1), 1);
});

test('hidden boards do not consume visible destination indexes', () => {
  assert.equal(boardDropIndex(['a', 'hidden', 'b'], ['a', 'b'], 'b', 0), 0);
  assert.equal(boardDropIndex(['a', 'hidden', 'b'], ['a', 'b'], 'a', 1), 2);
});
