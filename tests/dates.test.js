import test from 'node:test';
import assert from 'node:assert/strict';
import { duePresentation } from '../src/dates.js';

test('due dates use local calendar days and change across midnight', () => {
  const card = { dueDate: '2026-03-09', dueTime: '10:30' };
  assert.deepEqual(duePresentation(card, new Date(2026, 2, 8, 23, 59)), {
    text: '明天 10:30',
    overdue: false,
  });
  assert.deepEqual(duePresentation(card, new Date(2026, 2, 9, 0, 1)), {
    text: '今天 10:30',
    overdue: false,
  });
  assert.deepEqual(duePresentation(card, new Date(2026, 2, 9, 11)), {
    text: '已过期 · 2026-03-09 10:30',
    overdue: true,
  });
});
test('date-only tasks expire after the local day, completed and unrecognized dates remain readable', () => {
  const card = { dueDate: '2026-10-27' };
  assert.equal(duePresentation(card, new Date(2026, 9, 27, 23, 59)).overdue, false);
  assert.equal(duePresentation(card, new Date(2026, 9, 28)).overdue, true);
  assert.equal(duePresentation({ ...card, completed: true }, new Date(2026, 9, 28)).overdue, false);
  assert.deepEqual(duePresentation({ dueDate: 'legacy text' }, new Date()), {
    text: 'legacy text',
    overdue: false,
  });
  assert.deepEqual(duePresentation({ dueDate: '2026-02-31' }, new Date()), {
    text: '2026-02-31',
    overdue: false,
  });
});
