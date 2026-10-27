import { createRepository, STORAGE_KEY } from './repository.js';
const isExtension = !!globalThis.chrome?.runtime?.id;
// A development-only web preview. The distributed extension exclusively uses
// chrome.storage.local and its background writer.
const preview =
  !isExtension && import.meta.env.DEV
    ? createRepository({
        get: async (key) => ({
          [key]: JSON.parse(localStorage.getItem(key) || 'null') ?? undefined,
        }),
        set: async (value) => {
          for (const [key, data] of Object.entries(value))
            localStorage.setItem(key, JSON.stringify(data));
        },
      })
    : null;
async function request(message) {
  if (preview)
    return message.type === 'read' ? preview.read() : preview.dispatch(message.operation);
  if (!isExtension) throw new Error('请将 dist 文件夹作为 Chrome 扩展加载后使用。');
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) throw new Error(response?.error || '扩展后台未响应，请重新打开标签页');
  return response.state;
}
export const readState = () => request({ type: 'read' });
export const dispatch = (operation) => request({ type: 'dispatch', operation });
export function subscribe(onState) {
  if (!isExtension) return () => {};
  const listener = (changes, area) => {
    if (area === 'local' && changes[STORAGE_KEY]?.newValue) onState(changes[STORAGE_KEY].newValue);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
