import { APP_VERSION, clone, DEFAULT_OPTIONS, newId, same, safeUrl } from './model.ts';
import { issue } from './issues.ts';
import type { IssuePayload } from './issues.ts';
import type {
  AppData,
  AppState,
  Board,
  Bookmark,
  Card,
  Language,
  Options,
  Snapshot,
  Theme,
} from './types.ts';

export type ImportMode = 'merge' | 'replace' | 'copy';
export interface ImportOptions {
  mode?: ImportMode;
  recoverBoards?: boolean;
  recoverCards?: boolean;
}
export interface ImportStats {
  boards: number;
  cards: number;
  bookmarks: number;
  orphanBoardIds: string[];
  orphanCardIds: string[];
}
export interface ParsedImport {
  data: AppData;
  bookmarks: Bookmark[];
  options?: Partial<Options>;
  theme?: Theme;
  language?: Language;
  warnings: IssuePayload[];
  stats: ImportStats;
}
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const dangerous = (key: string): boolean => ['__proto__', 'constructor', 'prototype'].includes(key);
const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
function ensure(
  condition: unknown,
  code: string,
  message: string,
  values?: Record<string, string | number>,
): asserts condition {
  if (!condition) throw issue(code, message, values);
}
function strings(value: unknown, field: string): asserts value is string[] {
  ensure(
    Array.isArray(value) && value.every((v) => typeof v === 'string' && !dangerous(v)),
    'import.invalidIdArray',
    `${field} 必须是有效 ID 数组`,
    { field },
  );
}
function inspect(data: unknown, bookmarks: unknown, warnings: IssuePayload[]): ImportStats {
  ensure(object(data), 'import.invalidData', '文件格式错误：data 必须是对象');
  ensure(
    object(data.boards) && object(data.cards),
    'import.invalidCollections',
    '文件格式错误：boards/cards 必须是对象',
  );
  strings(data.boardOrder, 'boardOrder');
  ensure(
    new Set(data.boardOrder).size === data.boardOrder.length,
    'import.duplicateBoardOrder',
    'boardOrder 有重复 ID',
  );
  for (const name of ['boards', 'cards']) {
    const collection = name === 'boards' ? data.boards : data.cards;
    for (const [id, value] of Object.entries(collection)) {
      ensure(id && !dangerous(id), 'import.unsafeId', `${name} 包含非法 ID 键`, { name });
      ensure(
        object(value) && value.id === id,
        'import.mismatchedId',
        `${name} 的对象 ID 与键不一致`,
        { name },
      );
      ensure(typeof value.title === 'string', 'import.titleNotText', `${name} 的标题必须是文本`, {
        name,
      });
      if (!value.title.trim()) warnings.push({ code: 'import.emptyTitle' });
      for (const key of [
        'createdAt',
        'updatedAt',
        ...(name === 'cards' ? ['description', 'dueDate', 'dueTime', 'priority'] : []),
      ]) {
        ensure(
          value[key] == null || typeof value[key] === 'string',
          'import.fieldNotText',
          `${name}.${key} 必须是文本`,
          { field: `${name}.${key}` },
        );
      }
      for (const key of name === 'cards' ? ['completed'] : ['isHidden'])
        ensure(
          value[key] === undefined || typeof value[key] === 'boolean',
          'import.fieldNotBoolean',
          `${name}.${key} 必须是布尔值`,
          { field: `${name}.${key}` },
        );
    }
  }
  for (const id of data.boardOrder)
    ensure(
      Object.hasOwn(data.boards, id),
      'import.missingOrderedBoard',
      `排序引用的看板不存在：${id}`,
      { id },
    );
  const referenced = new Set();
  for (const board of Object.values(data.boards)) {
    ensure(object(board), 'import.boardNotObject', '看板必须是对象');
    if (board.cardIds === undefined) board.cardIds = [];
    strings(board.cardIds, 'cardIds');
    ensure(
      new Set(board.cardIds).size === board.cardIds.length,
      'import.duplicateCardRef',
      '看板中存在重复卡片引用',
    );
    for (const id of board.cardIds) {
      ensure(Object.hasOwn(data.cards, id), 'import.cardMissing', `看板引用的卡片不存在：${id}`, {
        id,
      });
      ensure(!referenced.has(id), 'import.cardMultipleBoards', `卡片被多个看板重复引用：${id}`, {
        id,
      });
      referenced.add(id);
    }
  }
  for (const card of Object.values(data.cards)) {
    ensure(object(card), 'import.cardNotObject', '卡片必须是对象');
    for (const field of ['labels', 'tags', 'history'])
      ensure(
        card[field] == null || Array.isArray(card[field]),
        'import.fieldNotArray',
        `${field} 必须是数组`,
        { field },
      );
    for (const field of ['labels', 'tags'])
      for (const entry of (card[field] || []) as unknown[]) {
        ensure(
          object(entry) && typeof entry.text === 'string',
          'import.entryMissingText',
          `${field} 元素必须包含文本`,
          { field },
        );
      }
  }
  ensure(Array.isArray(bookmarks), 'import.bookmarksNotArray', 'bookmarks 必须是数组');
  for (const bookmark of bookmarks as unknown[]) {
    ensure(
      object(bookmark) && typeof bookmark.name === 'string' && typeof bookmark.url === 'string',
      'import.bookmarkInvalid',
      '书签必须包含名称和 URL',
    );
    if (!bookmark.id) bookmark.id = newId('bookmark');
    ensure(
      typeof bookmark.id === 'string' && !dangerous(bookmark.id),
      'import.bookmarkIdInvalid',
      '书签 ID 无效',
    );
    if (!safeUrl(bookmark.url)) warnings.push({ code: 'import.invalidBookmarkUrl' });
  }
  ensure(
    new Set(bookmarks.map((b: unknown) => (b as Record<string, unknown>).id)).size ===
      bookmarks.length,
    'import.bookmarkIdDuplicate',
    '书签 ID 重复',
  );
  const order = data.boardOrder as string[];
  const orphanBoardIds = Object.keys(data.boards).filter((id) => !order.includes(id));
  const orphanCardIds = Object.keys(data.cards).filter((id) => !referenced.has(id));
  if (orphanBoardIds.length)
    warnings.push({ code: 'import.orphanBoards', values: { count: orphanBoardIds.length } });
  if (orphanCardIds.length)
    warnings.push({ code: 'import.orphanCards', values: { count: orphanCardIds.length } });
  return {
    boards: Object.keys(data.boards).length,
    cards: Object.keys(data.cards).length,
    bookmarks: bookmarks.length,
    orphanBoardIds,
    orphanCardIds,
  };
}
export function parseImport(text: string): ParsedImport {
  ensure(typeof text === 'string', 'import.contentRequired', '需要 JSON 文件内容');
  ensure(
    new TextEncoder().encode(text).length <= MAX_IMPORT_BYTES,
    'import.fileTooLarge',
    '文件超过 5 MiB，请拆分或减少内容后重试',
  );
  let input: unknown;
  try {
    input = JSON.parse(text.replace(/^\uFEFF/, ''));
  } catch {
    throw issue('import.invalidJson', '无法解析 JSON，请检查文件是否完整');
  }
  ensure(object(input), 'import.fileFormat', '文件格式错误');
  let source: Record<string, unknown> = input;
  let options: Partial<Options> | undefined;
  let theme: Theme | undefined;
  let language: Language | undefined;
  if (Object.hasOwn(input, 'format')) {
    ensure(input.format === 'ohmynewtabtodo', 'import.backupFormat', '不支持的备份格式');
    ensure(input.schemaVersion === 1, 'import.backupVersion', '不支持此备份版本，请升级扩展后重试');
    ensure(object(input.state), 'import.backupDataMissing', '完整备份缺少 state.data');
    const storedState = input.state;
    ensure(object(storedState.data), 'import.backupDataMissing', '完整备份缺少 state.data');
    source = { ...storedState.data, bookmarks: storedState.bookmarks };
    const rawOptions = storedState.options;
    ensure(object(rawOptions), 'import.backupOptionsMissing', '完整备份缺少设置');
    for (const key of Object.keys(DEFAULT_OPTIONS))
      ensure(
        rawOptions[key] === undefined || typeof rawOptions[key] === 'boolean',
        'import.optionType',
        `设置 ${key} 类型错误`,
        { key },
      );
    ensure(
      storedState.theme === 'dark' || storedState.theme === 'light',
      'import.backupThemeInvalid',
      '备份主题无效',
    );
    ensure(
      storedState.language === undefined ||
        storedState.language === 'en' ||
        storedState.language === 'zh-CN',
      'import.backupLanguageInvalid',
      '备份语言无效',
    );
    options = rawOptions as Partial<Options>;
    theme = storedState.theme;
    language = storedState.language as Language | undefined;
  }
  const warnings: IssuePayload[] = [];
  if (!Object.hasOwn(source, 'bookmarks')) warnings.push({ code: 'import.missingBookmarks' });
  const data = clone({ boards: source.boards, cards: source.cards, boardOrder: source.boardOrder });
  const bookmarks = clone(source.bookmarks === undefined ? [] : source.bookmarks);
  const stats = inspect(data, bookmarks, warnings);
  return {
    // inspect has validated the fields that the application reads while preserving extra data.
    data: data as AppData,
    bookmarks: bookmarks as Bookmark[],
    ...(options ? { options: clone(options), theme } : {}),
    ...(language ? { language } : {}),
    warnings: warnings.filter(
      (warning, index) =>
        warnings.findIndex((candidate) => JSON.stringify(candidate) === JSON.stringify(warning)) ===
        index,
    ),
    stats,
  };
}
export function prepareImport(
  current: AppState,
  parsed: ParsedImport,
  { mode = 'merge', recoverBoards = false, recoverCards = false } = {},
): AppState {
  ensure(['merge', 'replace', 'copy'].includes(mode), 'import.modeInvalid', '导入模式无效');
  const state = clone(current),
    incoming = clone(parsed);
  if (recoverBoards)
    for (const id of incoming.stats.orphanBoardIds)
      if (!incoming.data.boardOrder.includes(id)) incoming.data.boardOrder.push(id);
  if (recoverCards && incoming.stats.orphanCardIds.length) {
    const id = newId('board');
    incoming.data.boards[id] = {
      id,
      title: '恢复的卡片',
      cardIds: incoming.stats.orphanCardIds.slice(),
    };
    incoming.data.boardOrder.push(id);
  }
  if (mode === 'copy') {
    const boards: Record<string, Board> = {},
      cards: Record<string, Card> = {},
      boardIds: Record<string, string> = {},
      cardIds: Record<string, string> = {};
    for (const id of Object.keys(incoming.data.boards)) boardIds[id] = newId('board');
    for (const id of Object.keys(incoming.data.cards)) cardIds[id] = newId('card');
    for (const [id, card] of Object.entries(incoming.data.cards))
      cards[cardIds[id]] = { ...card, id: cardIds[id] };
    for (const [id, board] of Object.entries(incoming.data.boards))
      boards[boardIds[id]] = {
        ...board,
        id: boardIds[id],
        cardIds: board.cardIds.map((c) => cardIds[c]),
      };
    incoming.data = {
      boards,
      cards,
      boardOrder: incoming.data.boardOrder.map((id) => boardIds[id]),
    };
  }
  if (mode === 'replace') {
    state.data = incoming.data;
    state.bookmarks = incoming.bookmarks;
    if (incoming.options && incoming.theme) {
      state.options = { ...DEFAULT_OPTIONS, ...incoming.options };
      state.theme = incoming.theme;
      if (incoming.language) state.language = incoming.language;
    }
  } else {
    for (const [id, entity] of Object.entries(incoming.data.boards)) {
      if (Object.hasOwn(state.data.boards, id) && !same(state.data.boards[id], entity))
        throw issue('import.conflict', `ID ${id} 内容冲突。请改用“作为副本”或“替换”。`, { id });
      state.data.boards[id] = entity;
    }
    for (const [id, entity] of Object.entries(incoming.data.cards)) {
      if (Object.hasOwn(state.data.cards, id) && !same(state.data.cards[id], entity))
        throw issue('import.conflict', `ID ${id} 内容冲突。请改用“作为副本”或“替换”。`, { id });
      state.data.cards[id] = entity;
    }
    state.data.boardOrder = [...new Set([...state.data.boardOrder, ...incoming.data.boardOrder])];
    for (const bookmark of incoming.bookmarks) {
      const found = state.bookmarks.find((b) => b.id === bookmark.id);
      if (found && same(found, bookmark)) continue;
      if (found && mode !== 'copy')
        throw issue(
          'import.bookmarkConflict',
          `书签 ID ${bookmark.id} 内容冲突。请改用“作为副本”或“替换”。`,
          { id: bookmark.id },
        );
      state.bookmarks.push({ ...bookmark, id: found ? newId('bookmark') : bookmark.id });
    }
  }
  // Valid files can form an invalid graph when combined; validate the result before persistence.
  inspect(state.data, state.bookmarks, []);
  return state;
}
export function snapshot(state: AppState): Snapshot {
  return clone({
    data: state.data,
    bookmarks: state.bookmarks,
    options: state.options,
    theme: state.theme,
    language: state.language,
  });
}
export function exportLegacy(state: AppState) {
  return {
    id: Date.now(),
    appVersion: '0.2.0',
    bookmarks: clone(state.bookmarks),
    ...clone(state.data),
  };
}
export function exportFull(state: AppState) {
  return {
    format: 'ohmynewtabtodo',
    schemaVersion: 1,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    state: snapshot(state),
  };
}
