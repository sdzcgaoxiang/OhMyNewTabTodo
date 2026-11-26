import { createRepository } from './repository.ts';
import { issuePayload } from './issues.ts';
import type { RuntimeRequest, RuntimeResponse } from './protocol.ts';
import {
  createReminderService,
  NEXT_REMINDER_ALARM,
  RECONCILE_REMINDERS_ALARM,
} from './reminders.ts';
import { translate } from './i18n.ts';
const repository = createRepository(chrome.storage.local);
const reportReminderError = (error: unknown) => console.warn('Reminder delivery deferred', error);
async function ensureReconciliationAlarm() {
  const alarm = await chrome.alarms.get(RECONCILE_REMINDERS_ALARM);
  if (alarm?.periodInMinutes !== 1)
    await chrome.alarms.create(RECONCILE_REMINDERS_ALARM, { periodInMinutes: 1 });
}
const reminders = createReminderService({
  repository,
  area: chrome.storage.local,
  onError: reportReminderError,
  platform: {
    async schedule(next) {
      await ensureReconciliationAlarm();
      const alarm = await chrome.alarms.get(NEXT_REMINDER_ALARM);
      if (next === null) {
        if (alarm) await chrome.alarms.clear(NEXT_REMINDER_ALARM);
      } else if (alarm?.scheduledTime !== next) {
        await chrome.alarms.create(NEXT_REMINDER_ALARM, { when: next });
      }
    },
    async show(id, card, state) {
      if ((await chrome.notifications.getPermissionLevel()) !== 'granted')
        throw new Error('System notifications are disabled');
      await chrome.notifications.create(id, {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('assets/reminder-icon.png'),
        title: card.title || translate(state.language, '未命名卡片'),
        message: `${translate(state.language, '截止')}: ${[card.dueDate, card.dueTime].filter(Boolean).join(' ')}`,
      });
    },
  },
});
function syncReminders() {
  void reminders.sync().catch(reportReminderError);
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !['read', 'dispatch'].includes(message?.type)) return;
  const request = message as RuntimeRequest;
  const task = request.type === 'read' ? repository.read() : reminders.dispatch(request.operation);
  task.then(
    (state) => sendResponse({ ok: true, state } satisfies RuntimeResponse),
    (error: unknown) =>
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : '保存失败，请重试',
        issue: issuePayload(error) ?? { code: 'repository.writeFailed' },
      } satisfies RuntimeResponse),
  );
  return true;
});
chrome.action.onClicked.addListener(() =>
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') }),
);
chrome.runtime.onInstalled.addListener((details) => {
  syncReminders();
  if (details.reason === 'install')
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});
chrome.runtime.onStartup.addListener(syncReminders);
chrome.alarms.onAlarm.addListener((alarm) => {
  if ([NEXT_REMINDER_ALARM, RECONCILE_REMINDERS_ALARM].includes(alarm.name)) syncReminders();
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.app_state) syncReminders();
});
chrome.notifications.onClicked.addListener((id) => {
  if (!id.startsWith('ohmynewtabtodo:due:')) return;
  void chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  void chrome.notifications.clear(id);
});
// Chrome 120 may clear alarms on restart: recreate them on every worker activation.
void ensureReconciliationAlarm()
  .then(() => reminders.sync())
  .catch(reportReminderError);
