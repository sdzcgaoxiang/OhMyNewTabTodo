import { createRepository } from './repository.js';
const repository = createRepository(chrome.storage.local);
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !['read', 'dispatch'].includes(message?.type)) return;
  const task = message.type === 'read' ? repository.read() : repository.dispatch(message.operation);
  task.then(state => sendResponse({ ok: true, state }), error => sendResponse({ ok: false, error: error.message || '保存失败，请重试' }));
  return true;
});
chrome.action.onClicked.addListener(() => chrome.tabs.create({ url: chrome.runtime.getURL('index.html') }));
chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install') chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});
