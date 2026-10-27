import { createRepository } from './repository.ts';
import type { RuntimeRequest, RuntimeResponse } from './protocol.ts';
const repository = createRepository(chrome.storage.local);
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !['read', 'dispatch'].includes(message?.type)) return;
  const request = message as RuntimeRequest;
  const task = request.type === 'read' ? repository.read() : repository.dispatch(request.operation);
  task.then(
    (state) => sendResponse({ ok: true, state } satisfies RuntimeResponse),
    (error: unknown) =>
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : '保存失败，请重试',
      } satisfies RuntimeResponse),
  );
  return true;
});
chrome.action.onClicked.addListener(() =>
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') }),
);
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install')
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});
