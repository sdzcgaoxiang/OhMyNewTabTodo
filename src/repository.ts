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
    // Preserve the stored object and unknown fields; the checks above guard fields read by the writer.
    return {
      ...clone(stored),
      options: { ...DEFAULT_OPTIONS, ...(object(stored.options) ? stored.options : {}) },
    } as AppState;
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
