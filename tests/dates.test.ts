import test from 'node:test';
import assert from 'node:assert/strict';
import { duePresentation } from '../src/dates.ts';
import { localDateString, reminderTimestamp } from '../src/dates.ts';
import { emptyState } from '../src/model.ts';

test('reminders use local dates, 09:00 for all-day and an independent explicit time', () => {
  const options = emptyState().options;
  const card = { id: 'c', title: 'Task', dueDate: '2026-11-04' };
  assert.equal(localDateString(new Date(2026, 10, 4, 0, 1)), '2026-11-04');
  assert.equal(reminderTimestamp(card, options), new Date(2026, 10, 4, 9).getTime());
  assert.equal(
    reminderTimestamp(card, { ...options, allDayReminderTime: '07:15' }),
    new Date(2026, 10, 4, 7, 15).getTime(),
  );
  assert.equal(reminderTimestamp(card, { ...options, allDayReminders: false }), null);
  assert.equal(
    reminderTimestamp({ ...card, dueTime: '14:20' }, { ...options, allDayReminders: false }),
    new Date(2026, 10, 4, 14, 20).getTime(),
  );
});

test('invalid imported calendars and times never schedule guessed notifications', () => {
  const options = emptyState().options;
  for (const dueDate of ['', 'legacy', '2026-02-31', '2026-13-01', '2026-00-01'])
    assert.equal(reminderTimestamp({ id: 'c', title: 'C', dueDate }, options), null);
  for (const dueTime of ['25:00', '12:99', '9:30', 'legacy'])
    assert.equal(
      reminderTimestamp({ id: 'c', title: 'C', dueDate: '2026-11-04', dueTime }, options),
      null,
    );
  assert.equal(
    reminderTimestamp({ id: 'c', title: 'C', dueDate: '2026-11-04', completed: true }, options),
    null,
  );
});

test('DST gaps advance like local Date, repeated times choose the first occurrence', () => {
  const oldZone = process.env.TZ;
  process.env.TZ = 'America/New_York';
  try {
    const card = { id: 'c', title: 'C', dueDate: '2026-03-08', dueTime: '02:30' };
    assert.equal(
      reminderTimestamp(card, emptyState().options),
      new Date('2026-03-08T07:30:00Z').getTime(),
    );
    assert.equal(
      reminderTimestamp({ ...card, dueDate: '2026-11-01', dueTime: '01:30' }, emptyState().options),
      new Date('2026-11-01T05:30:00Z').getTime(),
    );
  } finally {
    if (oldZone === undefined) delete process.env.TZ;
    else process.env.TZ = oldZone;
  }
});

test('due dates use local calendar days and change across midnight', () => {
  const card = { id: 'card', title: 'Card', dueDate: '2026-03-09', dueTime: '10:30' };
  assert.deepEqual(duePresentation(card, new Date(2026, 2, 8, 23, 59), 'zh-CN'), {
    text: '明天 10:30',
    overdue: false,
  });
  assert.deepEqual(duePresentation(card, new Date(2026, 2, 9, 0, 1), 'zh-CN'), {
    text: '今天 10:30',
    overdue: false,
  });
  assert.deepEqual(duePresentation(card, new Date(2026, 2, 9, 11), 'zh-CN'), {
    text: '已过期 · 2026-03-09 10:30',
    overdue: true,
  });
});
test('due date labels follow the selected language while invalid dates stay raw', () => {
  const card = { id: 'card', title: 'Card', dueDate: '2026-03-09', dueTime: '10:30' };
  assert.equal(duePresentation(card, new Date(2026, 2, 8), 'en').text, 'Tomorrow 10:30');
  assert.equal(
    duePresentation(card, new Date(2026, 2, 9, 11), 'en').text,
    'Overdue · 2026-03-09 10:30',
  );
  assert.equal(
    duePresentation({ ...card, dueDate: 'legacy' }, new Date(), 'en').text,
    'legacy 10:30',
  );
});
test('date-only tasks expire after the local day, completed and unrecognized dates remain readable', () => {
  const card = { id: 'card', title: 'Card', dueDate: '2026-10-27' };
  assert.equal(duePresentation(card, new Date(2026, 9, 27, 23, 59)).overdue, false);
  assert.equal(duePresentation(card, new Date(2026, 9, 28)).overdue, true);
  assert.equal(duePresentation({ ...card, completed: true }, new Date(2026, 9, 28)).overdue, false);
  assert.deepEqual(duePresentation({ ...card, dueDate: 'legacy text' }, new Date()), {
    text: 'legacy text',
    overdue: false,
  });
  assert.deepEqual(duePresentation({ ...card, dueDate: '2026-02-31' }, new Date()), {
    text: '2026-02-31',
    overdue: false,
  });
});
