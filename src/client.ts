import { createRepository, STORAGE_KEY } from './repository.ts';
import type { RepositoryOperation } from './operations.ts';
import type { RuntimeRequest, RuntimeResponse } from './protocol.ts';
import type { AppState } from './types.ts';
const isExtension = !!globalThis.chrome?.runtime?.id;
// A development-only web preview. The distributed extension exclusively uses
// chrome.storage.local and its background writer.
const preview =
  !isExtension && import.meta.env.DEV
    ? createRepository({
        get: async (key: string) => ({
          [key]: JSON.parse(localStorage.getItem(key) || 'null') ?? undefined,
        }),
        set: async (value: Record<string, unknown>) => {
          for (const [key, data] of Object.entries(value))
            localStorage.setItem(key, JSON.stringify(data));
        },
      })
    : null;
async function request(message: RuntimeRequest): Promise<AppState> {
  if (preview)
    return message.type === 'read' ? preview.read() : preview.dispatch(message.operation);
  if (!isExtension) throw new Error('请将 dist 文件夹作为 Chrome 扩展加载后使用。');
  const response = (await chrome.runtime.sendMessage(message)) as RuntimeResponse | undefined;
  if (!response?.ok) throw new Error(response?.error || '扩展后台未响应，请重新打开标签页');
  return response.state;
}
export const readState = () => request({ type: 'read' });
export const dispatch = (operation: RepositoryOperation): Promise<AppState> =>
  request({ type: 'dispatch', operation });
export function subscribe(onState: (state: AppState) => void): () => void {
  if (!isExtension) return () => {};
  const listener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
    if (area === 'local' && changes[STORAGE_KEY]?.newValue)
      onState(changes[STORAGE_KEY].newValue as AppState);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
