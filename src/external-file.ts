import { createExternalSnapshot } from './external-snapshot.ts';
import type { AppState } from './types.ts';

type Writer = {
  write(value: string): Promise<void>;
  close(): Promise<void>;
  abort(): Promise<void>;
};
type Writable = { createWritable(): Promise<Writer> };
export async function writeSnapshot(handle: Writable, state: AppState, instanceId: string) {
  const snapshot = createExternalSnapshot(state, instanceId, new Date().toISOString());
  const stream = await handle.createWritable();
  try {
    await stream.write(JSON.stringify(snapshot, null, 2));
    await stream.close();
  } catch (error) {
    await stream.abort().catch(() => {});
    throw error;
  }
  return { revision: state.revision, exportedAt: snapshot.exportedAt };
}

type Handle = FileSystemFileHandle & {
  queryPermission(options: { mode: 'readwrite' }): Promise<PermissionState>;
  requestPermission(options: { mode: 'readwrite' }): Promise<PermissionState>;
};
type Config = {
  handle: Handle;
  instanceId: string;
  enabled: boolean;
  generation?: string;
  revision?: number;
  exportedAt?: string;
  error?: string;
};
const lockName = 'omntt-external-file';
const eventName = 'omntt-external-file-status';
async function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('omntt-external-file', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('settings');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function getConfig(): Promise<Config | undefined> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('settings', 'readonly');
    const request = tx.objectStore('settings').get('config');
    request.onsuccess = () => resolve(request.result as Config | undefined);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => database.close();
  });
}
async function saveConfig(config: Config): Promise<void> {
  const database = await db();
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction('settings', 'readwrite');
    tx.objectStore('settings').put(config, 'config');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  database.close();
  const channel = new BroadcastChannel(eventName);
  channel.postMessage('changed');
  channel.close();
  window.dispatchEvent(new Event(eventName));
}
export const supported = () =>
  !!globalThis.chrome?.runtime?.id &&
  'showOpenFilePicker' in window &&
  !!navigator.locks &&
  !!globalThis.indexedDB;
export const externalStatus = getConfig;
async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  return navigator.locks.request(lockName, fn);
}
async function checkOwner(handle: Handle, instanceId: string): Promise<void> {
  const content = await (await handle.getFile()).text();
  if (!content.trim()) return;
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('unrecognized-file');
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !('format' in parsed) ||
    parsed.format !== 'ohmynewtabtodo.readonly' ||
    !('formatVersion' in parsed) ||
    parsed.formatVersion !== 1 ||
    !('source' in parsed) ||
    !parsed.source ||
    typeof parsed.source !== 'object' ||
    !('instanceId' in parsed.source) ||
    typeof parsed.source.instanceId !== 'string'
  )
    throw new Error('unrecognized-file');
  if (parsed.source.instanceId !== instanceId) throw new Error('foreign-owner');
}
export async function refreshExternal(): Promise<void> {
  if (!supported()) return;
  await withLock(async () => {
    const config = await getConfig();
    if (!config?.enabled) return;
    try {
      if ((await config.handle.queryPermission({ mode: 'readwrite' })) !== 'granted')
        throw new Error('permission');
      await checkOwner(config.handle, config.instanceId);
      const result = await writeSnapshot(
        config.handle,
        await (await import('./client.ts')).readState(),
        config.instanceId,
      );
      await saveConfig({ ...config, ...result, error: undefined });
    } catch (error) {
      await saveConfig({ ...config, error: error instanceof Error ? error.message : 'failed' });
    }
  });
}
export async function selectExternal(): Promise<void> {
  const picker = (
    window as unknown as { showOpenFilePicker(options: unknown): Promise<Handle[]> }
  ).showOpenFilePicker.bind(window);
  const expected = getConfig();
  const [handle] = await picker({
    types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
  });
  if ((await handle.requestPermission({ mode: 'readwrite' })) !== 'granted')
    throw new Error('permission');
  await withLock(async () => {
    const old = await getConfig();
    if (old?.generation !== (await expected)?.generation) throw new Error('stale-selection');
    const instanceId = old?.instanceId ?? crypto.randomUUID();
    try {
      await checkOwner(handle, instanceId);
    } catch (error) {
      if (!(error instanceof Error && error.message === 'foreign-owner')) throw error;
      if (
        !window.confirm(
          'This file belongs to another instance. Replace its contents? / 此文件属于另一个实例，确定覆盖？',
        )
      )
        throw new Error('takeover-cancelled');
    }
    const result = await writeSnapshot(
      handle,
      await (await import('./client.ts')).readState(),
      instanceId,
    );
    await saveConfig({
      handle,
      enabled: true,
      instanceId,
      generation: crypto.randomUUID(),
      ...result,
    });
  });
}
export async function stopExternal(): Promise<void> {
  await withLock(async () => {
    const c = await getConfig();
    if (c) await saveConfig({ ...c, enabled: false, generation: crypto.randomUUID() });
  });
}
export async function reconnectExternal(config: Config): Promise<void> {
  if ((await config.handle.requestPermission({ mode: 'readwrite' })) !== 'granted')
    throw new Error('permission');
  await withLock(async () => {
    const c = await getConfig();
    if (c?.instanceId === config.instanceId && c.generation === config.generation)
      await saveConfig({ ...c, enabled: true, generation: crypto.randomUUID(), error: undefined });
  });
  await refreshExternal();
}
export function observeExternal(callback: () => void): () => void {
  const channel = new BroadcastChannel(eventName);
  channel.onmessage = callback;
  window.addEventListener(eventName, callback);
  return () => {
    channel.close();
    window.removeEventListener(eventName, callback);
  };
}
