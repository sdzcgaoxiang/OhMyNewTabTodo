import { test as base, expect, chromium } from '@playwright/test';
import type { Page } from '@playwright/test';
import path from 'node:path';
import { legacy } from '../fixtures.ts';
import { emptyState } from '../../src/model.ts';
declare global {
  interface Window {
    pendingFiles: Record<string, () => void>;
  }
}
const test = base.extend({
  context: async ({}, use) => {
    const extensionPath = path.resolve('dist');
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      headless: true,
      acceptDownloads: true,
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    await use(context);
    await context.close();
  },
  page: async ({ context }, use) => {
    let [worker] = context.serviceWorkers();
    if (!worker) worker = await context.waitForEvent('serviceworker');
    const id = new URL(worker.url()).host;
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`chrome-extension://${id}/index.html`);
    await use(page);
    expect(errors).toEqual([]);
  },
});
async function addBoard(page: Page, title = '工作') {
  await page.getByRole('button', { name: '新建看板', exact: true }).first().click();
  await page.getByLabel('看板名称').fill(title);
  await page.getByRole('button', { name: '保存看板' }).click();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
}
async function addCard(page: Page, title = '第一件事') {
  await page.getByRole('button', { name: '添加卡片到底部' }).first().click();
  await page.getByLabel('卡片标题').fill(title);
  await page.getByLabel('描述', { exact: true }).fill('安全文本 <b>不是 HTML</b>');
  await page.getByRole('button', { name: '保存卡片' }).click();
  await expect(page.getByRole('button', { name: title, exact: true })).toBeVisible();
}
async function openTransfer(page: Page) {
  await page.getByRole('button', { name: '设置', exact: true }).click();
  await page.getByRole('button', { name: '导入 / 导出', exact: true }).click();
}
async function upload(page: Page, data: unknown) {
  await page.getByLabel('选择 JSON 文件').setInputFiles({
    name: 'fixture.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(data)),
  });
}
test('existing app_state opens and edits without resetting revision or unknown fields', async ({
  page,
}) => {
  const sample = legacy();
  const oldState = {
    ...emptyState(),
    revision: 17,
    data: { boards: sample.boards, cards: sample.cards, boardOrder: sample.boardOrder },
    custom: { nested: [null, 'keep'] },
  };
  await page.evaluate((state) => chrome.storage.local.set({ app_state: state }), oldState);
  await page.reload();
  await expect(page.getByRole('heading', { name: '工作', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '检查导出', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '编辑卡片' }).click();
  await page.getByLabel('卡片标题').fill('迁移后编辑');
  await page.getByRole('button', { name: '保存卡片' }).click();
  await expect(page.getByRole('button', { name: '迁移后编辑', exact: true })).toBeVisible();
  const stored = await page.evaluate(
    async () => (await chrome.storage.local.get('app_state')).app_state,
  );
  expect(stored).toMatchObject({ revision: 18, custom: oldState.custom });
});
test('drag moves cards and reorders boards persistently', async ({ page }) => {
  await addBoard(page, 'A');
  await addBoard(page, 'B');
  await addCard(page, '拖动任务');
  const boardA = page
    .locator('.board')
    .filter({ has: page.getByRole('heading', { name: 'A', exact: true }) });
  const boardB = page
    .locator('.board')
    .filter({ has: page.getByRole('heading', { name: 'B', exact: true }) });
  await boardA.locator('.task-card').dragTo(boardB.locator('.board-card-list'), { steps: 12 });
  await expect(boardB.locator('.task-card')).toHaveCount(1);
  await expect(boardA.locator('.task-card')).toHaveCount(0);
  await boardA.locator('.board-header').dragTo(boardB.locator('.board-header'), { steps: 12 });
  await expect(page.locator('.board h2')).toHaveText(['B', 'A']);
  await page.reload();
  await expect(page.locator('.board h2')).toHaveText(['B', 'A']);
  await expect(page.locator('.board').first().locator('.task-card')).toHaveCount(1);
});
test('keyboard drag reorders cards in the same board', async ({ page }) => {
  await addBoard(page);
  await addCard(page, '甲');
  await addCard(page, '乙');
  await addCard(page, '丙');
  const cards = page.locator('.task-card');
  await cards.first().focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await expect(cards.locator('.card-title')).toHaveText(['乙', '甲', '丙']);
  await page.reload();
  await expect(page.locator('.task-card .card-title')).toHaveText(['乙', '甲', '丙']);
});
test('card display settings and hidden boards survive reload', async ({ page }) => {
  await addBoard(page);
  await addCard(page);
  await page.getByRole('checkbox', { name: '标记完成' }).click();
  await expect(page.getByRole('checkbox', { name: '取消完成' })).toBeChecked();
  await page.getByRole('button', { name: '设置', exact: true }).click();
  await page.getByRole('button', { name: '卡片', exact: true }).click();
  // Controlled settings reflect persisted storage, so wait for the async acknowledgement.
  await page.getByLabel('隐藏已完成卡片').click();
  await expect(page.getByLabel('隐藏已完成卡片')).toBeChecked();
  await page.getByLabel('紧凑模式').click();
  await expect(page.getByLabel('紧凑模式')).toBeChecked();
  await page.getByRole('button', { name: '关闭设置' }).click();
  await expect(page.locator('.task-card')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.task-card')).toHaveCount(0);
  await page.getByRole('button', { name: '显示完成项', exact: true }).click();
  await expect(page.locator('.task-card')).toHaveClass(/compact/);
  await page.getByRole('button', { name: '隐藏', exact: true }).click();
  await page.reload();
  await expect(page.locator('.board')).toHaveCount(0);
  await page.getByRole('button', { name: '显示隐藏看板', exact: true }).click();
  await expect(page.locator('.board')).toHaveCount(1);
});
test('due status refreshes after midnight without reloading the page', async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 9, 27, 23, 59, 45) });
  await page.reload();
  await addBoard(page);
  await addCard(page);
  await page.getByRole('button', { name: '编辑卡片' }).click();
  await page.getByLabel('截止日期').fill('2026-10-27');
  await page.getByRole('button', { name: '保存卡片' }).click();
  await expect(page.locator('.due-date')).toContainText('今天');
  await page.clock.runFor(31000);
  await expect(page.locator('.due-date')).toContainText('已过期');
});
test('create, edit, copy, complete and delete survive page reload', async ({ page }) => {
  await addBoard(page);
  await addCard(page);
  await page.getByRole('button', { name: '编辑卡片' }).first().click();
  await page.getByLabel('卡片标题').fill('修改后的任务');
  await page.getByRole('button', { name: '保存卡片' }).click();
  await page.getByRole('button', { name: '复制卡片' }).first().click();
  await expect(page.locator('.task-card')).toHaveCount(2);
  await page
    .context()
    .serviceWorkers()[0]
    .evaluate(() => {
      const save = chrome.storage.local.set.bind(chrome.storage.local);
      chrome.storage.local.set = async (values) => {
        await new Promise((resolve) => setTimeout(resolve, 250));
        return save(values);
      };
    });
  await page.getByRole('checkbox', { name: '标记完成' }).first().click();
  await expect(page.getByRole('checkbox', { name: '取消完成' })).toBeChecked();
  await page.reload();
  await expect(page.locator('.task-card')).toHaveCount(2);
  await expect(page.getByRole('checkbox', { name: '取消完成' })).toBeChecked();
  await page.getByRole('button', { name: '删除卡片' }).first().click();
  await page.getByRole('button', { name: '确认删除' }).click();
  await page.reload();
  await expect(page.locator('.task-card')).toHaveCount(1);
});
test('legacy missing-bookmarks import previews orphan boards and exports complete data', async ({
  page,
}) => {
  await openTransfer(page);
  await upload(page, legacy());
  await expect(page.getByText('原版导出缺少 bookmarks，已按空书签列表读取。')).toBeVisible();
  await page.getByLabel('恢复未列入顺序的看板').check();
  await page.getByRole('button', { name: '确认导入' }).click();
  await expect(page.getByText('导入已保存')).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出完整备份' }).click();
  const file = await download;
  const fs = await import('node:fs/promises');
  const output = JSON.parse(await fs.readFile(await file.path(), 'utf8'));
  expect(output.state.data.boardOrder).toEqual(['board-a', 'board-b']);
  expect(Object.keys(output.state.data.cards)).toHaveLength(2);
  expect(output.state.data.cards['card-a'].custom).toEqual({ keep: true });
  await page.getByRole('button', { name: '关闭设置' }).click();
  await expect(page.getByRole('button', { name: '检查导出', exact: true })).toBeVisible();
});
test('another tab updates immediately and stale card edit preserves draft', async ({
  page,
  context,
}) => {
  await addBoard(page);
  await addCard(page);
  const other = await context.newPage();
  await other.goto(page.url());
  await expect(other.locator('.task-card')).toHaveCount(1);
  await page.getByRole('button', { name: '编辑卡片' }).click();
  await page.getByLabel('卡片标题').fill('旧页面草稿');
  await other.getByRole('button', { name: '编辑卡片' }).click();
  await other.getByLabel('卡片标题').fill('另一页的更新');
  await other.getByRole('button', { name: '保存卡片' }).click();
  await page.getByRole('button', { name: '保存卡片' }).click();
  await expect(page.getByRole('dialog').getByText(/发生冲突/)).toBeVisible();
  await expect(page.getByLabel('卡片标题')).toHaveValue('旧页面草稿');
});
test('malformed import never changes data and replacement can be restored', async ({ page }) => {
  await addBoard(page, '原有看板');
  await openTransfer(page);
  await upload(page, { boards: {}, cards: {}, boardOrder: ['missing'] });
  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: /不存在/ })
      .first(),
  ).toBeVisible();
  await upload(page, legacy());
  await page.getByLabel('导入方式').selectOption('replace');
  await page.getByLabel('我确认替换当前数据').check();
  await page.getByRole('button', { name: '确认导入' }).click();
  await page.getByRole('button', { name: '恢复此备份' }).first().click();
  await page.getByRole('button', { name: '确认恢复' }).click();
  await page.getByRole('button', { name: '关闭设置' }).click();
  await expect(page.getByRole('heading', { name: '原有看板' })).toBeVisible();
});
test('settings, theme and bookmarks persist; card movement has keyboard alternative', async ({
  page,
}) => {
  await addBoard(page, 'A');
  await addBoard(page, 'B');
  await addCard(page);
  await page.getByLabel('移动到看板').selectOption({ label: 'B' });
  await expect(
    page
      .locator('.board')
      .filter({ has: page.getByRole('heading', { name: 'B', exact: true }) })
      .locator('.task-card'),
  ).toHaveCount(1);
  await page.getByRole('button', { name: '切换主题' }).click();
  await page.getByRole('button', { name: '常用链接', exact: true }).click();
  await page.getByLabel('链接名称').fill('示例');
  await page.getByLabel('网址', { exact: true }).fill('https://example.com/');
  await page.getByRole('button', { name: '添加链接' }).click();
  await page.getByRole('button', { name: '关闭常用链接' }).click();
  await page.reload();
  await expect(page.locator('.app')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: '常用链接', exact: true }).click();
  await expect(page.getByRole('link', { name: '示例' })).toHaveAttribute(
    'href',
    'https://example.com/',
  );
});
test('editing after another tab moves a card keeps the draft and does not move it back', async ({
  page,
  context,
}) => {
  await addBoard(page, 'A');
  await addBoard(page, 'B');
  await addCard(page);
  await page.getByRole('button', { name: '编辑卡片' }).click();
  await page.getByLabel('卡片标题').fill('保留我的草稿');
  const other = await context.newPage();
  await other.goto(page.url());
  await other.getByLabel('移动到看板').selectOption({ label: 'B' });
  await expect(
    other
      .locator('.board')
      .filter({ has: other.getByRole('heading', { name: 'B', exact: true }) })
      .locator('.task-card'),
  ).toHaveCount(1);
  await page.getByRole('button', { name: '保存卡片' }).click();
  await expect(page.getByRole('dialog').getByText(/移动|冲突/)).toBeVisible();
  await expect(page.getByLabel('卡片标题')).toHaveValue('保留我的草稿');
  await other.reload();
  await expect(
    other
      .locator('.board')
      .filter({ has: other.getByRole('heading', { name: 'B', exact: true }) })
      .locator('.task-card'),
  ).toHaveCount(1);
});
test('null legacy description opens details without crashing', async ({ page }) => {
  const data = legacy();
  data.cards['card-a'].description = null;
  await openTransfer(page);
  await upload(page, data);
  await page.getByRole('button', { name: '确认导入' }).click();
  await expect(page.getByText('导入已保存')).toBeVisible();
  await page.getByRole('button', { name: '关闭设置' }).click();
  await page.getByRole('button', { name: data.cards['card-a'].title, exact: true }).click();
  await expect(page.getByRole('heading', { name: '卡片详情', exact: true })).toBeVisible();
});
for (const priority of ['__proto__', 'constructor', 'toString'])
  test(`unrecognized priority ${priority} renders as text`, async ({ page }) => {
    const data = legacy();
    data.cards['card-a'].priority = priority;
    await openTransfer(page);
    await upload(page, data);
    await page.getByRole('button', { name: '确认导入' }).click();
    await expect(page.getByText('导入已保存')).toBeVisible();
    await page.getByRole('button', { name: '关闭设置' }).click();
    await expect(page.locator('.priority')).toContainText(priority);
    await page.getByRole('button', { name: data.cards['card-a'].title, exact: true }).click();
    await expect(
      page.getByRole('dialog').locator('dd').filter({ hasText: priority }),
    ).toBeVisible();
  });
test('editing a title preserves additional same-type legacy labels and metadata', async ({
  page,
}) => {
  const data = legacy();
  data.cards['card-a'].labels = [
    { id: 'one', type: 'primary', text: '一', custom: 1 },
    { id: 'two', type: 'primary', text: '二', custom: 2 },
    { id: 'three', type: 'secondary', text: '三', custom: 3 },
    { id: 'four', type: 'secondary', text: '四', custom: 4 },
  ];
  await openTransfer(page);
  await upload(page, data);
  await page.getByRole('button', { name: '确认导入' }).click();
  await expect(page.getByText('导入已保存')).toBeVisible();
  await page.getByRole('button', { name: '关闭设置' }).click();
  await page.getByRole('button', { name: '编辑卡片' }).click();
  await page.getByLabel('卡片标题').fill('仅修改标题');
  await page.getByRole('button', { name: '保存卡片' }).click();
  const stored = await page.evaluate(
    async () => (await chrome.runtime.sendMessage({ type: 'read' })).state,
  );
  expect(stored.data.cards['card-a'].labels).toEqual(data.cards['card-a'].labels);
});
for (const invalidOlder of [false, true])
  test(`latest file owns preview after older ${invalidOlder ? 'invalid' : 'valid'} read finishes last`, async ({
    page,
  }) => {
    await openTransfer(page);
    await page.evaluate(() => {
      const read = File.prototype.text;
      window.pendingFiles = {};
      File.prototype.text = async function () {
        const text = await read.call(this);
        return new Promise((resolve) => {
          window.pendingFiles[this.name] = () => resolve(text);
        });
      };
    });
    for (const name of ['older.json', 'newer.json']) {
      await page.getByLabel('选择 JSON 文件').setInputFiles({
        name,
        mimeType: 'application/json',
        buffer: Buffer.from(
          name === 'older.json' && invalidOlder ? 'invalid JSON' : JSON.stringify(legacy()),
        ),
      });
      await page.waitForFunction((name) => !!window.pendingFiles[name], name);
    }
    await page.evaluate(() => window.pendingFiles['newer.json']());
    await expect(page.locator('.filename')).toHaveText('newer.json');
    await page.evaluate(() => window.pendingFiles['older.json']());
    // Wait for the pending read and subsequent extension message to settle.
    await page.evaluate(async () => {
      await chrome.runtime.sendMessage({ type: 'read' });
    });
    await expect(page.locator('.filename')).toHaveText('newer.json');
    await expect(page.locator('.transfer [role="alert"]')).toHaveCount(0);
  });
