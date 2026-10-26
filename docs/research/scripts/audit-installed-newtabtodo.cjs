// Research harness, not product code. Reads an explicitly supplied local 0.2.0
// installation; does not distribute its implementation or access real storage.
// Usage: node audit-installed-newtabtodo.cjs /absolute/path/to/0.2.0_0
// Node VM is used for isolation of effects, not as a security boundary for untrusted code.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const root = process.argv[2];
if (!root) throw new Error('Supply the path to a trusted local NewTabTodo 0.2.0 installation.');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
assert.equal(manifest.version, '0.2.0');
const source = fs.readFileSync(path.join(root, 'assets/js/index.ba38.js'), 'utf8');
const vendor = fs.readFileSync(path.join(root, 'assets/js/vendor.ba38.chunk.js'), 'utf8');
const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const ctx = vm.createContext({
  console, window: {}, setTimeout: () => 0,
  fetch: () => { throw new Error('Network is disabled in this audit'); },
});
vm.runInContext(vendor, ctx);
const modules = ctx.window.webpackJsonp[0][1];
const cache = {};
function requireBundled(id) {
  if (cache[id]) return cache[id].exports;
  const module = cache[id] = { exports: {} };
  modules[id](module, module.exports, requireBundled);
  return module.exports;
}
requireBundled.n = m => () => m && m.__esModule ? m.default : m;
requireBundled.d = (e, k, g) => Object.defineProperty(e, k, { get: g });
requireBundled.o = (e, k) => Object.hasOwn(e, k);
requireBundled.r = e => Object.defineProperty(e, '__esModule', { value: true });
let nextId = 0;
let db = {}, failWrites = false, writes = 0, exported;
Object.assign(ctx, {
  b: () => requireBundled(5), y: { a: requireBundled(4) },
  u: () => requireBundled(7), p: () => requireBundled(6),
  g: () => requireBundled(3), l: () => requireBundled(14),
  z: { a: '0.2.0' }, $: () => {},
  me: e => Object.prototype.toString.call(e).slice(8, -1).toLowerCase(),
  de: () => String(++nextId), Ce: value => { exported = clone(value); },
  chrome: { storage: { sync: {
    get: async key => clone(key ? { [key]: db[key] } : db),
    set: async values => {
      writes++;
      if (failWrites) throw new Error('QUOTA_BYTES quota exceeded');
      Object.assign(db, clone(values));
    },
    remove: async keys => { for (const key of [].concat(keys)) delete db[key]; },
  } } },
});
function section(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a);
  assert.ok(a >= 0 && b > a, `Missing source anchors: ${start}, ${end}`);
  return source.slice(a, b);
}
for (const [start, end] of [
  ['function L(e,t)', 'var H='], ['var H=', 'var z='],
  ['function J(e,t)', 'function U(e,t)'], ['function Ee(e)', 'var Ce='],
]) vm.runInContext(section(start, end), ctx);

// Exercise the actual provider handlers with deterministic state hooks. React
// effects are suppressed; persistence is invoked explicitly after each handler.
let hooks = [], hookIndex = 0;
Object.assign(ctx, {
  r: { useState(initial) {
    const index = hookIndex++;
    if (!(index in hooks)) hooks[index] = initial;
    return [hooks[index], value => { hooks[index] = value; }];
  }, useEffect() {} },
  n: { a: { createElement: (type, props, ...children) => ({ type, props, children }) } },
  Ie: Object.assign, Te: String, Ne: ['boardId'], Me: { Provider: 'provider' },
  Be: { boardOrder: [], boards: {}, cards: {} }, xe: [], Se() {}, pe: () => false,
});
vm.runInContext('var ' + section('Re=function', 'Re.defaultProps'), ctx);
function render() { hookIndex = 0; return ctx.Re({ children: null }).props.value; }
function fixture() {
  return {
    boardOrder: ['board-a'],
    boards: { 'board-a': { id: 'board-a', title: 'Synthetic board', cardIds: ['card-a', 'card-b'] } },
    cards: {
      'card-a': { id: 'card-a', title: 'Synthetic A' },
      'card-b': { id: 'card-b', title: 'Synthetic B' },
    },
  };
}
function reset(data = fixture()) {
  db = clone({ ...data.cards, ...data.boards, boardOrder: data.boardOrder, isMigrated: true, app_bookmarks: [] });
  hooks = [clone(data)]; writes = 0; failWrites = false;
}
function backup() { return { id: 1, appVersion: '0.2.0', bookmarks: [], ...fixture() }; }
const results = [];
async function check(name, fn) {
  reset();
  const details = await fn();
  results.push({ name, verified: true, ...details });
}
(async () => {
  await check('missing_bookmarks_rejects_before_write', async () => {
    const input = backup(); delete input.bookmarks;
    await assert.rejects(ctx.Ee(JSON.stringify(input)), /file corrupted/);
    assert.equal(writes, 0); return { writes };
  });
  await check('missing_target_bookmarks_rejects', async () => {
    delete db.app_bookmarks;
    await assert.rejects(ctx.Ee(JSON.stringify(backup())), /iterable/);
    assert.equal(writes, 0); return { writes };
  });
  await check('export_omits_missing_bookmarks', async () => {
    delete db.app_bookmarks; await ctx.ke();
    assert.equal(Object.hasOwn(exported, 'bookmarks'), false);
  });
  await check('quota_failure_reports_success', async () => {
    const before = clone(db); failWrites = true;
    assert.equal(await ctx.Ee(JSON.stringify(backup())), true);
    assert.deepEqual(db, before); return { attemptedWrites: writes };
  });
  await check('unordered_board_is_written_under_undefined_key', async () => {
    const input = backup(); input.boardOrder = [];
    assert.equal(await ctx.Ee(JSON.stringify(input)), true);
    assert.ok(Object.hasOwn(db, 'undefined'));
  });
  await check('bookmarks_truncated_to_15', async () => {
    const input = backup();
    input.bookmarks = Array.from({ length: 25 }, (_, i) => ({ id: String(i), name: `Link ${i}`, url: `https://example.com/${i}` }));
    await ctx.Ee(JSON.stringify(input)); assert.equal(db.app_bookmarks.length, 15);
    return { supplied: 25, stored: 15 };
  });
  await check('roundtrip_appends_duplicates', async () => {
    await ctx.ke(); await ctx.Ee(JSON.stringify(exported));
    const count = Object.keys(db).filter(k => k.startsWith('card-')).length;
    assert.equal(count, 4); return { cardsBefore: 2, cardsAfter: count };
  });
  await check('delete_board_leaves_persistent_board_and_cards', async () => {
    render().deleteBoard('board-a');
    render().confirmationDialogData.actions.secondary.props.onClick();
    assert.equal(hooks[0].boardOrder.length, 0);
    assert.equal(Object.keys(hooks[0].cards).length, 0);
    await ctx.q.setData(hooks[0]);
    const reloaded = await ctx.q.getData();
    assert.ok(reloaded.boards['board-a']); assert.equal(Object.keys(reloaded.cards).length, 2);
    assert.equal(reloaded.boardOrder.length, 0);
    return { remainingStoredBoards: 1, remainingStoredCards: 2 };
  });
  await check('delete_card_leaves_persistent_card', async () => {
    render().deleteCard('card-a');
    render().confirmationDialogData.actions.secondary.props.onClick();
    assert.equal(Object.hasOwn(hooks[0].cards, 'card-a'), false);
    await ctx.q.setData(hooks[0]); const reloaded = await ctx.q.getData();
    assert.ok(reloaded.cards['card-a']);
    assert.equal(reloaded.boards['board-a'].cardIds.includes('card-a'), false);
  });
  await check('stale_snapshot_overwrites_another_cards_edit', async () => {
    const first = clone(await ctx.q.getData()), second = clone(await ctx.q.getData());
    first.cards['card-a'].title = 'Changed A'; await ctx.q.setData(first);
    second.cards['card-b'].title = 'Changed B'; await ctx.q.setData(second);
    const result = await ctx.q.getData();
    assert.equal(result.cards['card-a'].title, 'Synthetic A');
    assert.equal(result.cards['card-b'].title, 'Changed B');
  });
  await check('unknown_card_fields_omitted_by_export', async () => {
    db['card-a'].customAuditField = 'synthetic'; await ctx.ke();
    assert.equal(Object.hasOwn(exported.cards['card-a'], 'customAuditField'), false);
  });
  const metadata = {
    extensionVersion: manifest.version,
    sourceSha256: crypto.createHash('sha256').update(source).digest('hex'),
    vendorSha256: crypto.createHash('sha256').update(vendor).digest('hex'),
    method: 'Original local functions with synthetic data and mocked storage; no browser/network writes; provider effects manually persisted.',
    passed: results.length, results,
  };
  console.log(JSON.stringify(metadata, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
