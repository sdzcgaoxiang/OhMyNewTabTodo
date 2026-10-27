import { applyOperation, clone, DEFAULT_OPTIONS, emptyState, newId, same } from './model.ts';
import { parseImport, prepareImport, snapshot } from './transfer.ts';
import type { RepositoryOperation } from './operations.ts';
import type { AppState } from './types.ts';

export interface StorageArea {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry: unknown) => typeof entry === 'string');

// A read never repairs or rekeys persisted data. It only checks the fields used by the UI/writer.
export function isAppState(value: unknown): value is AppState {
  if (!object(value) || value.schemaVersion !== 1 || !Number.isSafeInteger(value.revision))
    return false;
  if (!object(value.data)) return false;
  const data = value.data;
  const boards = data.boards;
  const cards = data.cards;
  const boardOrder = data.boardOrder;
  const options = value.options;
  if (!object(boards) || !object(cards) || !strings(boardOrder)) return false;
  if (!Array.isArray(value.bookmarks) || !object(options)) return false;
  if (value.theme !== 'light' && value.theme !== 'dark') return false;
  if (!Array.isArray(value.backups) || !Array.isArray(value.imports)) return false;
  if (Object.entries(DEFAULT_OPTIONS).some(([key]) => typeof options[key] !== 'boolean'))
    return false;
  if (
    Object.entries(boards).some(
      ([id, board]) =>
        !object(board) ||
        board.id !== id ||
        typeof board.title !== 'string' ||
        !strings(board.cardIds),
    )
  )
    return false;
  if (boardOrder.some((id) => !Object.hasOwn(boards, id))) return false;
  if (
    Object.entries(cards).some(
      ([id, card]) =>
        !object(card) ||
        card.id !== id ||
        typeof card.title !== 'string' ||
        (card.labels != null &&
          (!Array.isArray(card.labels) ||
            card.labels.some(
              (label: unknown) => !object(label) || typeof label.text !== 'string',
            ))),
    )
  )
    return false;
  if (
    value.bookmarks.some(
      (bookmark: unknown) =>
        !object(bookmark) ||
        typeof bookmark.id !== 'string' ||
        typeof bookmark.name !== 'string' ||
        typeof bookmark.url !== 'string',
    )
  )
    return false;
  return true;
}
export const STORAGE_KEY = 'app_state';
export function createRepository(area: StorageArea): {
  read(): Promise<AppState>;
  dispatch(operation: RepositoryOperation): Promise<AppState>;
} {
  let queue: Promise<unknown> = Promise.resolve();
  async function read(): Promise<AppState> {
    const stored = (await area.get(STORAGE_KEY))[STORAGE_KEY];
    if (stored === undefined) return emptyState();
    if (!object(stored) || stored.schemaVersion !== 1)
      throw new Error('本地数据版本不受支持，请勿清空数据；请更新扩展。');
    if (
      !Number.isSafeInteger(stored.revision) ||
      (stored.revision as number) < 0 ||
      !object(stored.data) ||
      !object(stored.data.boards) ||
      !object(stored.data.cards) ||
      !Array.isArray(stored.data.boardOrder) ||
      !Array.isArray(stored.backups)
    )
      throw new Error('本地数据结构异常，请保留备份后检查。');
    const state = {
      ...clone(stored),
      options: { ...DEFAULT_OPTIONS, ...(object(stored.options) ? stored.options : {}) },
    };
    if (!isAppState(state)) throw new Error('本地数据结构异常，请保留备份后检查。');
    return state;
  }
  function recovery(next: AppState, previous: AppState, label: string): AppState {
    next.backups = [
      {
        id: newId('backup'),
        createdAt: new Date().toISOString(),
        label,
        state: snapshot(previous),
      },
      ...previous.backups,
    ].slice(0, 3);
    return next;
  }
  async function execute(op: RepositoryOperation): Promise<AppState> {
    const previous = await read();
    let next: AppState;
    if (op.type === 'import' || op.type === 'restore' || op.type === 'clear') {
      if (!Number.isSafeInteger(op.expectedRevision))
        throw new Error('缺少预览版本，请重新预览后操作');
      if (op.expectedRevision !== previous.revision)
        throw new Error('预览已过期：数据已发生变化，请重新预览后操作');
    }
    if (op.type === 'import') {
      next = prepareImport(previous, parseImport(op.text), op);
      if (same(snapshot(previous), snapshot(next))) return previous;
      recovery(next, previous, '导入前');
    } else if (op.type === 'restore') {
      const backup = previous.backups.find((b) => b.id === op.id);
      if (!backup) throw new Error('恢复点已不存在');
      next = recovery({ ...previous, ...clone(backup.state) }, previous, '恢复前');
    } else if (op.type === 'clear') {
      next = recovery({ ...previous, data: emptyState().data, bookmarks: [] }, previous, '清空前');
    } else next = applyOperation(previous, op);
    next.revision = previous.revision + 1;
    await area.set({ [STORAGE_KEY]: next });
    return next;
  }
  function dispatch(operation: RepositoryOperation): Promise<AppState> {
    const task = queue.then(() => execute(operation));
    queue = task.catch(() => {});
    return task;
  }
  return { read, dispatch };
}
