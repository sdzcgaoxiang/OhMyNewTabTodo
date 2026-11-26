import type { StorageArea } from './repository.ts';
import type { RepositoryOperation } from './operations.ts';
import type { AppState, Card } from './types.ts';
import { localDateString, reminderTimestamp } from './dates.ts';
import { same } from './model.ts';

export const REMINDER_STORAGE_KEY = 'reminder_delivery_v1';
export const NEXT_REMINDER_ALARM = 'ohmynewtabtodo:reminder:next';
export const RECONCILE_REMINDERS_ALARM = 'ohmynewtabtodo:reminder:reconcile';

interface ReminderDependencies {
  repository: {
    read(): Promise<AppState>;
    dispatch(operation: RepositoryOperation): Promise<AppState>;
  };
  area: StorageArea;
  platform: {
    schedule(next: number | null): Promise<void>;
    show(id: string, card: Card, state: AppState): Promise<void>;
  };
  now?: () => Date;
  onError?: (error: unknown) => void;
}

interface DeliveryEntry {
  delivered: string[];
  pending?: { signature: string; when: number };
}
interface DeliveryLedger {
  version: 1;
  entries: Record<string, DeliveryEntry>;
}
const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

function readLedger(value: unknown): DeliveryLedger {
  if (value === undefined) return { version: 1, entries: {} };
  if (!object(value) || value.version !== 1 || !object(value.entries))
    throw new Error('Invalid reminder delivery ledger');
  for (const entry of Object.values(value.entries)) {
    if (
      !object(entry) ||
      !Array.isArray(entry.delivered) ||
      entry.delivered.some((s: unknown) => typeof s !== 'string')
    )
      throw new Error('Invalid reminder delivery entry');
    if (
      entry.pending !== undefined &&
      (!object(entry.pending) ||
        typeof entry.pending.signature !== 'string' ||
        typeof entry.pending.when !== 'number' ||
        !Number.isFinite(entry.pending.when))
    )
      throw new Error('Invalid pending reminder');
  }
  return structuredClone(value) as unknown as DeliveryLedger;
}

async function notificationId(cardId: string, signature: string): Promise<string> {
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify([cardId, signature])),
  );
  return (
    'ohmynewtabtodo:due:' +
    Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('')
  );
}

export function createReminderService({
  repository,
  area,
  platform,
  now = () => new Date(),
  onError = () => {},
}: ReminderDependencies) {
  let queue: Promise<unknown> = Promise.resolve();
  function serial<T>(task: () => Promise<T>): Promise<T> {
    const result = queue.then(task);
    queue = result.catch(() => {});
    return result;
  }
  async function reconcile(): Promise<void> {
    const state = await repository.read();
    const original = (await area.get(REMINDER_STORAGE_KEY))[REMINDER_STORAGE_KEY];
    const ledger = readLedger(original);
    const date = now();
    const today = localDateString(date);
    const time = date.getTime();
    const liveIds = new Set(
      state.data.boardOrder.flatMap((id) => state.data.boards[id]?.cardIds ?? []),
    );
    for (const id of Object.keys(ledger.entries)) {
      if (!Object.hasOwn(state.data.cards, id)) delete ledger.entries[id];
      else if (!liveIds.has(id)) delete ledger.entries[id].pending;
    }
    for (const [id, card] of Object.entries(state.data.cards)) {
      const when = liveIds.has(id) ? reminderTimestamp(card, state.options) : null;
      const entry = Object.hasOwn(ledger.entries, id) ? ledger.entries[id] : { delivered: [] };
      // Wall-clock schedule identity deliberately excludes timezone, title and all-day preferences.
      const signature = JSON.stringify([card.dueDate, card.dueTime || null]);
      const registered = entry.pending?.signature === signature;
      delete entry.pending;
      if (
        when !== null &&
        !entry.delivered.includes(signature) &&
        (when > time || registered || (card.dueDate || '') >= today)
      )
        entry.pending = { signature, when };
      if (entry.pending || entry.delivered.length) ledger.entries[id] = entry;
      else delete ledger.entries[id];
    }
    // Record plans before side effects so a restart can catch missed reminders.
    if (!same(original, ledger)) await area.set({ [REMINDER_STORAGE_KEY]: ledger });
    let next: number | null = null;
    for (const [id, entry] of Object.entries(ledger.entries)) {
      if (!entry.pending) continue;
      if (entry.pending.when > time) {
        next = Math.min(next ?? Infinity, entry.pending.when);
        continue;
      }
      const { signature } = entry.pending;
      try {
        // All background mutations share this queue, so state cannot change mid-delivery.
        await platform.show(await notificationId(id, signature), state.data.cards[id], state);
      } catch (error) {
        onError(error);
        next = Math.min(next ?? Infinity, time + 60_000);
        continue;
      }
      entry.delivered.push(signature);
      delete entry.pending;
      await area.set({ [REMINDER_STORAGE_KEY]: ledger });
    }
    await platform.schedule(next);
  }
  return {
    sync: () => serial(reconcile),
    dispatch: (operation: RepositoryOperation) =>
      serial(async () => {
        const state = await repository.dispatch(operation);
        try {
          await reconcile();
        } catch (error) {
          onError(error);
        }
        // A notification failure must never misreport a persisted task as a failed save.
        return state;
      }),
  };
}
