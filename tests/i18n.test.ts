import test from 'node:test';
import assert from 'node:assert/strict';
import { formatClockDate, formatIssue, formatRecoveryLabel, translate } from '../src/i18n.ts';
import { parseImport, prepareImport } from '../src/transfer.ts';
import { emptyState } from '../src/model.ts';
import { legacy } from './fixtures.ts';

test('interface labels and dynamic counts use the selected language', () => {
  assert.equal(translate('en', 'home.boards'), 'My boards');
  assert.equal(translate('zh-CN', 'home.boards'), '我的看板');
  assert.equal(translate('en', 'home.completedCount', { done: 2, total: 3 }), '2 / 3 completed');
  assert.equal(translate('zh-CN', 'home.completedCount', { done: 2, total: 3 }), '2 / 3 已完成');
  assert.equal(
    translate('en', 'app.deleteBoardQuestion', { title: 'Work', count: 1 }),
    'Delete “Work” and its 1 card?',
  );
  assert.equal(translate('en', 'app.backupCardCount', { count: 1 }), '1 card');
});

test('dates and historical recovery labels are localized without modifying stored text', () => {
  const date = new Date(2026, 2, 9, 12);
  assert.match(formatClockDate('en', date), /Monday.*March 9/);
  assert.match(formatClockDate('zh-CN', date), /3月9日.*星期一/);
  assert.equal(formatRecoveryLabel('en', '导入前'), 'Before import');
  assert.equal(formatRecoveryLabel('zh-CN', '导入前'), '导入前');
  assert.equal(formatRecoveryLabel('en', 'Custom label'), 'Custom label');
});

test('unknown issues have a safe fallback in the selected language', () => {
  assert.equal(
    formatIssue('en', { code: 'unknown.from.future' }),
    'Something went wrong. Please try again.',
  );
  assert.equal(formatIssue('zh-CN', { code: 'unknown.from.future' }), '发生错误，请重试。');
});

test('import warnings and conflict errors render in English with user IDs unchanged', () => {
  const parsed = parseImport(JSON.stringify(legacy()));
  assert.ok(parsed.warnings.some((warning) => formatIssue('en', warning).includes('bookmarks')));
  assert.ok(parsed.warnings.some((warning) => formatIssue('en', warning).includes('1 board')));
  const source = prepareImport(emptyState(), parsed);
  source.data.cards['card-a'].title = 'changed';
  assert.throws(
    () => prepareImport(source, parsed),
    (error: unknown) => {
      assert.equal(
        formatIssue('en', error),
        'ID card-a has conflicting content. Use Copy or Replace.',
      );
      return true;
    },
  );
  assert.throws(
    () => parseImport('not json'),
    (error: unknown) => {
      assert.equal(
        formatIssue('en', error),
        'Could not read JSON. Check that the file is complete.',
      );
      return true;
    },
  );
});
