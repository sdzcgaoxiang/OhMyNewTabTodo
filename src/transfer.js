import { APP_VERSION, clone, DEFAULT_OPTIONS, newId, same, safeUrl } from './model.js';
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const dangerous = key => ['__proto__', 'constructor', 'prototype'].includes(key);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function ensure(condition, message) { if (!condition) throw new Error(message); }
function strings(value, field) { ensure(Array.isArray(value) && value.every(v => typeof v === 'string' && !dangerous(v)), `${field} 必须是有效 ID 数组`); }
function inspect(data, bookmarks, warnings) {
  ensure(object(data.boards) && object(data.cards), '文件格式错误：boards/cards 必须是对象');
  strings(data.boardOrder, 'boardOrder');
  ensure(new Set(data.boardOrder).size === data.boardOrder.length, 'boardOrder 有重复 ID');
  for (const name of ['boards', 'cards']) {
    for (const [id, value] of Object.entries(data[name])) {
      ensure(id && !dangerous(id), `${name} 包含非法 ID 键`);
      ensure(object(value) && value.id === id, `${name} 的对象 ID 与键不一致`);
      ensure(typeof value.title === 'string', `${name} 的标题必须是文本`);
      if (!value.title.trim()) warnings.push('存在空标题，将原样保留，可在导入后编辑。');
      for (const key of ['createdAt', 'updatedAt', ...(name === 'cards' ? ['description', 'dueDate', 'dueTime', 'priority'] : [])]) {
        ensure(value[key] == null || typeof value[key] === 'string', `${name}.${key} 必须是文本`);
      }
      for (const key of name === 'cards' ? ['completed'] : ['isHidden']) ensure(value[key] === undefined || typeof value[key] === 'boolean', `${name}.${key} 必须是布尔值`);
    }
  }
  for (const id of data.boardOrder) ensure(Object.hasOwn(data.boards, id), `排序引用的看板不存在：${id}`);
  const referenced = new Set();
  for (const board of Object.values(data.boards)) {
    if (board.cardIds === undefined) board.cardIds = [];
    strings(board.cardIds, 'cardIds');
    ensure(new Set(board.cardIds).size === board.cardIds.length, '看板中存在重复卡片引用');
    for (const id of board.cardIds) {
      ensure(Object.hasOwn(data.cards, id), `看板引用的卡片不存在：${id}`);
      ensure(!referenced.has(id), `卡片被多个看板重复引用：${id}`); referenced.add(id);
    }
  }
  for (const card of Object.values(data.cards)) {
    for (const field of ['labels', 'tags', 'history']) ensure(card[field] == null || Array.isArray(card[field]), `${field} 必须是数组`);
    for (const field of ['labels', 'tags']) for (const entry of card[field] || []) {
      ensure(object(entry) && typeof entry.text === 'string', `${field} 元素必须包含文本`);
    }
  }
  ensure(Array.isArray(bookmarks), 'bookmarks 必须是数组');
  for (const bookmark of bookmarks) {
    ensure(object(bookmark) && typeof bookmark.name === 'string' && typeof bookmark.url === 'string', '书签必须包含名称和 URL');
    if (!bookmark.id) bookmark.id = newId('bookmark');
    ensure(typeof bookmark.id === 'string' && !dangerous(bookmark.id), '书签 ID 无效');
    if (!safeUrl(bookmark.url)) warnings.push('有书签地址无法安全打开；数据会保留，但不会成为链接。');
  }
  ensure(new Set(bookmarks.map(b => b.id)).size === bookmarks.length, '书签 ID 重复');
  const orphanBoardIds = Object.keys(data.boards).filter(id => !data.boardOrder.includes(id));
  const orphanCardIds = Object.keys(data.cards).filter(id => !referenced.has(id));
  if (orphanBoardIds.length) warnings.push(`${orphanBoardIds.length} 个看板未列入显示顺序；数据将保留。`);
  if (orphanCardIds.length) warnings.push(`${orphanCardIds.length} 张卡片未关联看板；数据将保留，可恢复到新看板。`);
  return { boards: Object.keys(data.boards).length, cards: Object.keys(data.cards).length, bookmarks: bookmarks.length, orphanBoardIds, orphanCardIds };
}
export function parseImport(text) {
  ensure(typeof text === 'string', '需要 JSON 文件内容');
  ensure(new TextEncoder().encode(text).length <= MAX_IMPORT_BYTES, '文件超过 5 MiB，请拆分或减少内容后重试');
  let input;
  try { input = JSON.parse(text.replace(/^\uFEFF/, '')); } catch { throw new Error('无法解析 JSON，请检查文件是否完整'); }
  ensure(object(input), '文件格式错误');
  let source = input, options, theme;
  if (Object.hasOwn(input, 'format')) {
    ensure(input.format === 'ohmynewtabtodo', '不支持的备份格式');
    ensure(input.schemaVersion === 1, '不支持此备份版本，请升级扩展后重试');
    ensure(object(input.state) && object(input.state.data), '完整备份缺少 state.data');
    source = { ...input.state.data, bookmarks: input.state.bookmarks };
    options = input.state.options; theme = input.state.theme;
    ensure(object(options), '完整备份缺少设置');
    for (const key of Object.keys(DEFAULT_OPTIONS)) ensure(options[key] === undefined || typeof options[key] === 'boolean', `设置 ${key} 类型错误`);
    ensure(['dark', 'light'].includes(theme), '备份主题无效');
  }
  const warnings = [];
  if (!Object.hasOwn(source, 'bookmarks')) warnings.push('原版导出缺少 bookmarks，已按空书签列表读取。');
  const data = clone({ boards: source.boards, cards: source.cards, boardOrder: source.boardOrder });
  const bookmarks = clone(source.bookmarks === undefined ? [] : source.bookmarks);
  const stats = inspect(data, bookmarks, warnings);
  return { data, bookmarks, ...(options ? { options: clone(options), theme } : {}), warnings: [...new Set(warnings)], stats };
}
export function prepareImport(current, parsed, { mode = 'merge', recoverBoards = false, recoverCards = false } = {}) {
  ensure(['merge', 'replace', 'copy'].includes(mode), '导入模式无效');
  const state = clone(current), incoming = clone(parsed);
  if (recoverBoards) for (const id of incoming.stats.orphanBoardIds) if (!incoming.data.boardOrder.includes(id)) incoming.data.boardOrder.push(id);
  if (recoverCards && incoming.stats.orphanCardIds.length) {
    const id = newId('board'); incoming.data.boards[id] = { id, title: '恢复的卡片', cardIds: incoming.stats.orphanCardIds.slice() }; incoming.data.boardOrder.push(id);
  }
  if (mode === 'copy') {
    const boards = {}, cards = {}, boardIds = {}, cardIds = {};
    for (const id of Object.keys(incoming.data.boards)) boardIds[id] = newId('board');
    for (const id of Object.keys(incoming.data.cards)) cardIds[id] = newId('card');
    for (const [id, card] of Object.entries(incoming.data.cards)) cards[cardIds[id]] = { ...card, id: cardIds[id] };
    for (const [id, board] of Object.entries(incoming.data.boards)) boards[boardIds[id]] = { ...board, id: boardIds[id], cardIds: board.cardIds.map(c => cardIds[c]) };
    incoming.data = { boards, cards, boardOrder: incoming.data.boardOrder.map(id => boardIds[id]) };
  }
  if (mode === 'replace') {
    state.data = incoming.data; state.bookmarks = incoming.bookmarks;
    if (incoming.options) { state.options = { ...DEFAULT_OPTIONS, ...incoming.options }; state.theme = incoming.theme; }
  } else {
    for (const category of ['boards', 'cards']) for (const [id, entity] of Object.entries(incoming.data[category])) {
      if (Object.hasOwn(state.data[category], id) && !same(state.data[category][id], entity)) throw new Error(`ID ${id} 内容冲突。请改用“作为副本”或“替换”。`);
      state.data[category][id] = entity;
    }
    state.data.boardOrder = [...new Set([...state.data.boardOrder, ...incoming.data.boardOrder])];
    for (const bookmark of incoming.bookmarks) {
      const found = state.bookmarks.find(b => b.id === bookmark.id);
      if (found && same(found, bookmark)) continue;
      if (state.bookmarks.some(b => b.url === bookmark.url && b.name === bookmark.name)) continue;
      state.bookmarks.push({ ...bookmark, id: found ? newId('bookmark') : bookmark.id });
    }
  }
  return state;
}
export function snapshot(state) {
  return clone({ data: state.data, bookmarks: state.bookmarks, options: state.options, theme: state.theme });
}
export function exportLegacy(state) {
  return { id: Date.now(), appVersion: '0.2.0', bookmarks: clone(state.bookmarks), ...clone(state.data) };
}
export function exportFull(state) {
  return { format: 'ohmynewtabtodo', schemaVersion: 1, appVersion: APP_VERSION, exportedAt: new Date().toISOString(), state: snapshot(state) };
}
