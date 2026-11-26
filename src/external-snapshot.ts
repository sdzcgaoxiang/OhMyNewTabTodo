import { APP_VERSION } from './model.ts';
import type { AppState } from './types.ts';

const text = (v: unknown): string | null => {
  if (v == null) return null;
  if (typeof v !== 'string') throw new Error('Invalid snapshot text field');
  return v;
};
const flag = (v: unknown): boolean => {
  if (v === undefined) return false;
  if (typeof v !== 'boolean') throw new Error('Invalid snapshot boolean field');
  return v;
};
export function createExternalSnapshot(state: AppState, instanceId: string, exportedAt: string) {
  const boards = Object.fromEntries(
    Object.entries(state.data.boards).map(([id, b]) => [
      id,
      {
        id: b.id,
        title: b.title,
        cardIds: [...b.cardIds],
        isHidden: flag(b.isHidden),
        createdAt: text(b.createdAt),
        updatedAt: text(b.updatedAt),
      },
    ]),
  );
  const cards = Object.fromEntries(
    Object.entries(state.data.cards).map(([id, c]) => [
      id,
      {
        id: c.id,
        title: c.title,
        completed: flag(c.completed),
        description: text(c.description),
        labels: (c.labels ?? []).map((l) => ({
          text: l.text,
          ...(l.id == null ? {} : { id: text(l.id) }),
          ...(l.type == null ? {} : { type: text(l.type) }),
        })),
        tags: (c.tags ?? []).map((t) => ({ text: text(t.text) })),
        priority: text(c.priority),
        dueDate: text(c.dueDate),
        dueTime: text(c.dueTime),
        createdAt: text(c.createdAt),
        updatedAt: text(c.updatedAt),
      },
    ]),
  );
  return {
    format: 'ohmynewtabtodo.readonly',
    formatVersion: 1,
    source: { instanceId, appVersion: APP_VERSION, revision: state.revision },
    exportedAt,
    data: { boardOrder: [...state.data.boardOrder], boards, cards },
  };
}
