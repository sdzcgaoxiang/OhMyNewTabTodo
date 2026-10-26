import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyState } from '../src/model.js';
import { parseImport, prepareImport, exportLegacy, exportFull } from '../src/transfer.js';
import { legacy } from './fixtures.js';
const parse = data => parseImport(JSON.stringify(data));
test('legacy export missing bookmarks imports without discarding orphan boards', () => {
  const p = parse(legacy());
  assert.deepEqual(p.bookmarks, []);
  assert.deepEqual(p.stats.orphanBoardIds, ['board-b']);
  const state = prepareImport(emptyState(), p, { mode: 'merge', recoverBoards: false });
  assert.deepEqual(state.data.boardOrder, ['board-a']);
  assert.equal(Object.keys(state.data.boards).length, 2);
  assert.deepEqual(state.data.cards['card-a'].custom, { keep: true });
});
test('recovery is explicit and does not mutate parsed input', () => {
  const p = parse(legacy());
  const state = prepareImport(emptyState(), p, { mode: 'merge', recoverBoards: true });
  assert.deepEqual(state.data.boardOrder, ['board-a', 'board-b']);
  assert.deepEqual(p.data.boardOrder, ['board-a']);
});
test('25 bookmarks and long titles are preserved', () => {
  const data = legacy(); data.cards['card-a'].title = '中'.repeat(150);
  data.bookmarks = Array.from({ length: 25 }, (_, i) => ({ id: String(i), name: '完整长名称'.repeat(4), url: `https://example.com/${i}` }));
  const state = prepareImport(emptyState(), parse(data), { mode: 'merge' });
  assert.equal(state.bookmarks.length, 25);
  assert.equal(state.data.cards['card-a'].title.length, 150);
  assert.equal(state.bookmarks[0].name, data.bookmarks[0].name);
});
test('same file merged twice is idempotent', () => {
  const p = parse(legacy()); const state = prepareImport(emptyState(), p, { mode: 'merge' });
  const again = prepareImport(state, p, { mode: 'merge' });
  assert.deepEqual(again.data, state.data);
});
test('conflicting IDs reject; copy mode remaps all references', () => {
  const p = parse(legacy()); const state = prepareImport(emptyState(), p, { mode: 'merge' });
  state.data.cards['card-a'].title = '本地修改';
  assert.throws(() => prepareImport(state, p, { mode: 'merge' }), /冲突/);
  const copy = prepareImport(state, p, { mode: 'copy', recoverBoards: true });
  assert.equal(Object.keys(copy.data.cards).length, 4);
  assert.equal(copy.data.cards['card-a'].title, '本地修改');
  for (const b of Object.values(copy.data.boards)) for (const id of b.cardIds) assert.ok(copy.data.cards[id]);
});
test('legacy and full exports preserve business data, full includes settings', () => {
  const state = prepareImport(emptyState(), parse(legacy()), { mode: 'merge' });
  state.options.showCompactCards = true; state.theme = 'light';
  const old = parse(exportLegacy(state));
  assert.deepEqual(old.data, state.data); assert.deepEqual(old.bookmarks, []);
  const full = parse(exportFull(state));
  const restored = prepareImport(emptyState(), full, { mode: 'replace' });
  assert.deepEqual(restored.data, state.data);
  assert.equal(restored.options.showCompactCards, true); assert.equal(restored.theme, 'light');
});
test('bad references, unsafe keys, future schema and non-JSON reject', () => {
  const bad = legacy(); bad.boards['board-a'].cardIds.push('missing');
  assert.throws(() => parse(bad), /引用|不存在/);
  assert.throws(() => parseImport('{"boards":{"__proto__":{}},"cards":{},"boardOrder":[]}'), /键|ID/);
  assert.throws(() => parse({ format: 'ohmynewtabtodo', schemaVersion: 999, state: {} }), /版本/);
  assert.throws(() => parseImport('not json'), /JSON/);
});
test('unknown formats and malformed optional fields fail before writing', () => {
  assert.throws(() => parse({ hello: 'world' }), /格式|board/);
  const bad = legacy(); bad.cards['card-a'].labels = 'not array';
  assert.throws(() => parse(bad), /labels|标签/);
});
