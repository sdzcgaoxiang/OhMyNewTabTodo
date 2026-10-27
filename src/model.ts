import type { AppData, AppState, Options } from './types.ts';
import type { ModelOperation } from './operations.ts';

export const APP_VERSION = '0.1.0';
export const DEFAULT_OPTIONS = Object.freeze({
  playSoundEffects: true,
  allowHidingBoard: true,
  hideCardDescription: false,
  linkFormatting: true,
  dimCompletedCards: true,
  hideCompletedCards: false,
  showCompactCards: false,
  hideGoogleSearch: false,
  hideDuckDuckGoSearch: true,
  hideBingSearch: true,
  hideYoutubeSearch: false,
  showClock: true,
  twentyFourHours: false,
  pinClock: true,
});
export const clone = <T>(value: T): T => structuredClone(value);
export const newId = (prefix: string): string => `${prefix}-${crypto.randomUUID()}`;
export function same(a: unknown, b: unknown): boolean {
  const stable = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(stable)
      : value && typeof value === 'object'
        ? Object.fromEntries(
            Object.keys(value)
              .sort()
              .map((key) => [key, stable((value as Record<string, unknown>)[key])]),
          )
        : value;
  return JSON.stringify(stable(a)) === JSON.stringify(stable(b));
}
export function emptyState(): AppState {
  return {
    schemaVersion: 1,
    revision: 0,
    data: { boards: {}, cards: {}, boardOrder: [] },
    bookmarks: [],
    options: { ...DEFAULT_OPTIONS },
    theme: 'dark',
    backups: [],
    imports: [],
  };
}
export function safeUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
function title(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('标题不能为空');
  return value.trim();
}
function item<T>(map: Record<string, T>, id: string): T {
  if (!Object.hasOwn(map, id)) throw new Error('对象已被删除，请刷新后重试');
  return map[id];
}
function checkExpected(current: unknown, expected: unknown): void {
  if (expected !== undefined && !same(current, expected))
    throw new Error('内容已被其他页面修改，发生冲突。请保留草稿并重新打开。');
}
function insert(list: string[], id: string, index = list.length): void {
  list.splice(
    Math.max(0, Math.min(Number.isFinite(index) ? index : list.length, list.length)),
    0,
    id,
  );
}
function moveCard(data: AppData, id: string, boardId: string, index?: number): void {
  item(data.cards, id);
  const target = item(data.boards, boardId);
  for (const board of Object.values(data.boards))
    board.cardIds = board.cardIds.filter((key) => key !== id);
  insert(target.cardIds, id, index);
}
function bottom(data: AppData): void {
  for (const board of Object.values(data.boards))
    board.cardIds.sort(
      (a, b) => Number(!!data.cards[a]?.completed) - Number(!!data.cards[b]?.completed),
    );
}
export function applyOperation(input: AppState, op: ModelOperation): AppState {
  const state = clone(input),
    data = state.data,
    now = new Date().toISOString();
  switch (op.type) {
    case 'board.add': {
      const id = op.id || newId('board');
      if (Object.hasOwn(data.boards, id) || ['__proto__', 'constructor', 'prototype'].includes(id))
        throw new Error('看板 ID 冲突');
      data.boards[id] = { id, title: title(op.title || '新看板'), cardIds: [], createdAt: now };
      data.boardOrder.push(id);
      break;
    }
    case 'board.update': {
      const board = item(data.boards, op.id);
      checkExpected(board, op.expected);
      if ('title' in op.patch) board.title = title(op.patch.title);
      if ('isHidden' in op.patch) board.isHidden = !!op.patch.isHidden;
      board.updatedAt = now;
      break;
    }
    case 'board.delete': {
      const board = item(data.boards, op.id);
      checkExpected(board, op.expected);
      delete data.boards[op.id];
      data.boardOrder = data.boardOrder.filter((id) => id !== op.id);
      for (const id of board.cardIds)
        if (!Object.values(data.boards).some((b) => b.cardIds.includes(id))) delete data.cards[id];
      break;
    }
    case 'board.move': {
      item(data.boards, op.id);
      data.boardOrder = data.boardOrder.filter((id) => id !== op.id);
      insert(data.boardOrder, op.id, op.index);
      break;
    }
    case 'card.add': {
      const board = item(data.boards, op.boardId),
        id = op.id || newId('card');
      if (Object.hasOwn(data.cards, id) || ['__proto__', 'constructor', 'prototype'].includes(id))
        throw new Error('卡片 ID 冲突');
      data.cards[id] = {
        ...clone(op.card),
        id,
        title: title(op.card.title),
        createdAt: op.card.createdAt || now,
      };
      insert(board.cardIds, id, op.index);
      break;
    }
    case 'card.update': {
      const card = item(data.cards, op.id);
      checkExpected(card, op.expected);
      if (
        op.expectedBoardId !== undefined &&
        !data.boards[op.expectedBoardId]?.cardIds.includes(op.id)
      )
        throw new Error('卡片已被其他页面移动，发生冲突。请保留草稿并重新打开。');
      const patch = clone(op.patch);
      delete patch.id;
      delete patch.createdAt;
      if ('title' in patch) patch.title = title(patch.title);
      data.cards[op.id] = { ...card, ...patch, updatedAt: now };
      if (op.boardId && !item(data.boards, op.boardId).cardIds.includes(op.id))
        moveCard(data, op.id, op.boardId);
      break;
    }
    case 'card.delete': {
      checkExpected(item(data.cards, op.id), op.expected);
      delete data.cards[op.id];
      for (const board of Object.values(data.boards))
        board.cardIds = board.cardIds.filter((id) => id !== op.id);
      break;
    }
    case 'card.copy': {
      const original = item(data.cards, op.id),
        board = Object.values(data.boards).find((b) => b.cardIds.includes(op.id));
      if (!board) throw new Error('卡片未关联看板，请先恢复');
      const id = op.newId || newId('card');
      if (Object.hasOwn(data.cards, id) || ['__proto__', 'constructor', 'prototype'].includes(id))
        throw new Error('卡片 ID 冲突');
      data.cards[id] = { ...clone(original), id, createdAt: now, updatedAt: now };
      board.cardIds.splice(board.cardIds.indexOf(op.id) + 1, 0, id);
      break;
    }
    case 'card.move':
      moveCard(data, op.id, op.boardId, op.index);
      break;
    case 'card.toggle': {
      const card = item(data.cards, op.id);
      card.completed = !card.completed;
      card.updatedAt = now;
      if (state.options.hideCompletedCards) bottom(data);
      break;
    }
    case 'completed.bottom':
      bottom(data);
      break;
    case 'options.patch': {
      for (const [key, value] of Object.entries(op.patch))
        if (Object.hasOwn(DEFAULT_OPTIONS, key)) state.options[key as keyof Options] = !!value;
      if (op.patch.hideCompletedCards === true) bottom(data);
      break;
    }
    case 'theme':
      if (!['light', 'dark'].includes(op.theme)) throw new Error('主题无效');
      state.theme = op.theme;
      break;
    case 'bookmark.add': {
      if (!safeUrl(op.bookmark.url)) throw new Error('请输入有效的 http 或 https 网址');
      state.bookmarks.push({
        ...clone(op.bookmark),
        id: newId('bookmark'),
        name: title(op.bookmark.name),
      });
      break;
    }
    case 'bookmark.delete':
      state.bookmarks = state.bookmarks.filter((b) => b.id !== op.id);
      break;
    default:
      throw new Error('无法识别的操作');
  }
  return state;
}
