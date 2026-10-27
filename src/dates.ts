import type { Card } from './types.ts';
// Dates represent the user's local calendar, never an implicit UTC timestamp.
export function duePresentation(card: Card, now = new Date()): { text: string; overdue: boolean } {
  const raw = [card.dueDate, card.dueTime].filter(Boolean).join(' ');
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(card.dueDate || '');
  if (!match) return { text: raw, overdue: false };
  const [, year, month, day] = match.map(Number);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day)
    return { text: raw, overdue: false };
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
    ? `已过期 · ${card.dueDate}`
    : distance === 0
      ? '今天'
      : distance === 1
        ? '明天'
        : card.dueDate;
  return { text: [label, card.dueTime].filter(Boolean).join(' '), overdue };
}
