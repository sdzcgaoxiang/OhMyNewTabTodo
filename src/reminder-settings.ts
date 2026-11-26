import type { Options } from './types.ts';

export function validReminderTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function allDayReminderTime(options: Options): string {
  return validReminderTime(options.allDayReminderTime) ? options.allDayReminderTime : '09:00';
}
