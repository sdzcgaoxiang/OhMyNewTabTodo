import type { Card, Language, Options } from './types.ts';
import { allDayReminderTime, validReminderTime } from './reminder-settings.ts';

export function localDateString(now = new Date()): string {
  return [
    now.getFullYear().toString().padStart(4, '0'),
    (now.getMonth() + 1).toString().padStart(2, '0'),
    now.getDate().toString().padStart(2, '0'),
  ].join('-');
}

function localCalendar(value: string | null | undefined): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

export function reminderTimestamp(card: Card, options: Options): number | null {
  if (card.completed) return null;
  const date = localCalendar(card.dueDate);
  if (!date) return null;
  const explicitTime = !!card.dueTime;
  if (!explicitTime && options.allDayReminders === false) return null;
  const time = explicitTime ? card.dueTime : allDayReminderTime(options);
  if (!validReminderTime(time)) return null;
  const [hours, minutes] = time.split(':').map(Number);
  // Native Date advances a DST gap and chooses the first repeated local time.
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
}
// Dates represent the user's local calendar, never an implicit UTC timestamp.
export function duePresentation(
  card: Card,
  now = new Date(),
  language: Language = 'en',
): { text: string; overdue: boolean } {
  const raw = [card.dueDate, card.dueTime].filter(Boolean).join(' ');
  const date = localCalendar(card.dueDate);
  if (!date) return { text: raw, overdue: false };
  const calendarNumber = (value: Date) => {
    const utc = new Date(0);
    utc.setUTCFullYear(value.getFullYear(), value.getMonth(), value.getDate());
    utc.setUTCHours(0, 0, 0, 0);
    return utc.getTime() / 86400000;
  };
  const distance = calendarNumber(date) - calendarNumber(now);
  const time = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(card.dueTime || '');
  const expiredToday =
    distance === 0 &&
    time &&
    now.getHours() * 60 + now.getMinutes() >= Number(time[1]) * 60 + Number(time[2]);
  const overdue = !card.completed && (distance < 0 || !!expiredToday);
  const label = overdue
    ? `${language === 'en' ? 'Overdue' : '已过期'} · ${card.dueDate}`
    : distance === 0
      ? language === 'en'
        ? 'Today'
        : '今天'
      : distance === 1
        ? language === 'en'
          ? 'Tomorrow'
          : '明天'
        : card.dueDate;
  return { text: [label, card.dueTime].filter(Boolean).join(' '), overdue };
}
