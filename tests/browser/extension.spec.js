import { test as base, expect, chromium } from '@playwright/test';
import path from 'node:path';
import { legacy } from '../fixtures.js';
const test = base.extend({
  context: async ({}, use) => {
    const extensionPath = path.resolve('dist');
    const context = await chromium.launchPersistentContext('', { channel: 'chromium', headless: true, acceptDownloads: true, args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`] });
    await use(context); await context.close();
  },
  page: async ({ context }, use) => {
    let [worker] = context.serviceWorkers(); if (!worker) worker = await context.waitForEvent('serviceworker');
    const id = new URL(worker.url()).host; const page = await context.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`chrome-extension://${id}/index.html`); await use(page);
    expect(errors).toEqual([]);
  },
});
async function addBoard(page, title = '工作') {
  await page.getByRole('button', { name: '新建看板', exact: true }).first().click();
  await page.getByLabel('看板名称').fill(title); await page.getByRole('button', { name: '保存看板' }).click();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
}
async function addCard(page, title = '第一件事') {
  await page.getByRole('button', { name: '添加卡片到底部' }).first().click();
  await page.getByLabel('卡片标题').fill(title); await page.getByLabel('描述', { exact: true }).fill('安全文本 <b>不是 HTML</b>');
  await page.getByRole('button', { name: '保存卡片' }).click();
  await expect(page.getByRole('button', { name: title, exact: true })).toBeVisible();
}
async function openTransfer(page) {
  await page.getByRole('button', { name: '设置', exact: true }).click();
  await page.getByRole('button', { name: '导入 / 导出', exact: true }).click();
}
async function upload(page, data) {
  await page.getByLabel('选择 JSON 文件').setInputFiles({ name: 'fixture.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
}
test('create, edit, copy, complete and delete survive page reload', async ({ page }) => {
  await addBoard(page); await addCard(page);
  await page.getByRole('button', { name: '编辑卡片' }).first().click();
  await page.getByLabel('卡片标题').fill('修改后的任务'); await page.getByRole('button', { name: '保存卡片' }).click();
  await page.getByRole('button', { name: '复制卡片' }).first().click();
  await expect(page.locator('.task-card')).toHaveCount(2);
  await page.getByRole('checkbox', { name: '标记完成' }).first().check();
  await page.reload(); await expect(page.locator('.task-card')).toHaveCount(2);
  await expect(page.getByRole('checkbox', { name: '取消完成' })).toBeChecked();
  await page.getByRole('button', { name: '删除卡片' }).first().click();
  await page.getByRole('button', { name: '确认删除' }).click();
  await page.reload(); await expect(page.locator('.task-card')).toHaveCount(1);
});
test('legacy missing-bookmarks import previews orphan boards and exports complete data', async ({ page }) => {
  await openTransfer(page); await upload(page, legacy());
  await expect(page.getByText('原版导出缺少 bookmarks，已按空书签列表读取。')).toBeVisible();
  await page.getByLabel('恢复未列入顺序的看板').check();
  await page.getByRole('button', { name: '确认导入' }).click();
  await expect(page.getByText('导入已保存')).toBeVisible();
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: '导出完整备份' }).click();
  const file = await download; const fs = await import('node:fs/promises');
  const output = JSON.parse(await fs.readFile(await file.path(), 'utf8'));
  expect(output.state.data.boardOrder).toEqual(['board-a', 'board-b']);
  expect(Object.keys(output.state.data.cards)).toHaveLength(2);
  expect(output.state.data.cards['card-a'].custom).toEqual({ keep: true });
  await page.getByRole('button', { name: '关闭设置' }).click();
  await expect(page.getByRole('button', { name: '检查导出', exact: true })).toBeVisible();
});
test('another tab updates immediately and stale card edit preserves draft', async ({ page, context }) => {
  await addBoard(page); await addCard(page);
  const other = await context.newPage(); await other.goto(page.url());
  await expect(other.locator('.task-card')).toHaveCount(1);
  await page.getByRole('button', { name: '编辑卡片' }).click();
  await page.getByLabel('卡片标题').fill('旧页面草稿');
  await other.getByRole('button', { name: '编辑卡片' }).click();
  await other.getByLabel('卡片标题').fill('另一页的更新'); await other.getByRole('button', { name: '保存卡片' }).click();
  await page.getByRole('button', { name: '保存卡片' }).click();
  await expect(page.getByRole('dialog').getByText(/发生冲突/)).toBeVisible();
  await expect(page.getByLabel('卡片标题')).toHaveValue('旧页面草稿');
});
test('malformed import never changes data and replacement can be restored', async ({ page }) => {
  await addBoard(page, '原有看板'); await openTransfer(page);
  await upload(page, { boards: {}, cards: {}, boardOrder: ['missing'] });
  await expect(page.getByRole('alert').filter({ hasText: /不存在/ }).first()).toBeVisible();
  await upload(page, legacy()); await page.getByLabel('导入方式').selectOption('replace');
  await page.getByLabel('我确认替换当前数据').check(); await page.getByRole('button', { name: '确认导入' }).click();
  await page.getByRole('button', { name: '恢复此备份' }).first().click();
  await page.getByRole('button', { name: '确认恢复' }).click();
  await page.getByRole('button', { name: '关闭设置' }).click();
  await expect(page.getByRole('heading', { name: '原有看板' })).toBeVisible();
});
test('settings, theme and bookmarks persist; card movement has keyboard alternative', async ({ page }) => {
  await addBoard(page, 'A'); await addBoard(page, 'B'); await addCard(page);
  await page.getByLabel('移动到看板').selectOption({ label: 'B' });
  await expect(page.locator('.board').filter({ has: page.getByRole('heading', { name: 'B', exact: true }) }).locator('.task-card')).toHaveCount(1);
  await page.getByRole('button', { name: '切换主题' }).click();
  await page.getByRole('button', { name: '常用链接', exact: true }).click();
  await page.getByLabel('链接名称').fill('示例'); await page.getByLabel('网址', { exact: true }).fill('https://example.com/');
  await page.getByRole('button', { name: '添加链接' }).click(); await page.getByRole('button', { name: '关闭常用链接' }).click();
  await page.reload(); await expect(page.locator('.app')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: '常用链接', exact: true }).click(); await expect(page.getByRole('link', { name: '示例' })).toHaveAttribute('href', 'https://example.com/');
});
