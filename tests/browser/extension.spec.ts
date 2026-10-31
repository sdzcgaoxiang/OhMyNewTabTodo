import { test as base, expect, chromium } from '@playwright/test';
import type { Page } from '@playwright/test';
import path from 'node:path';
import { legacy } from '../fixtures.ts';
import { emptyState } from '../../src/model.ts';
import type { AppState } from '../../src/types.ts';
declare global {
  interface Window {
    pendingFiles: Record<string, () => void>;
  }
}
const test = base.extend<{ rawPage: Page }>({
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
    await page.evaluate((state) => chrome.storage.local.set({ app_state: state }), {
      ...emptyState(),
      language: 'zh-CN',
    });
    await page.reload();
    await use(page);
    expect(errors).toEqual([]);
  },
  rawPage: async ({ context }, use) => {
    let [worker] = context.serviceWorkers();
    if (!worker) worker = await context.waitForEvent('serviceworker');
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`chrome-extension://${new URL(worker.url()).host}/index.html`);
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
test('English is the fresh default and homepage language switch persists across tabs', async ({
  rawPage,
  context,
}) => {
  await expect(rawPage.getByRole('heading', { name: 'My boards' })).toBeVisible();
  await expect(rawPage.getByRole('button', { name: 'English' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(rawPage.locator('html')).toHaveAttribute('lang', 'en');
  await rawPage.getByRole('button', { name: '简体中文' }).click();
  await expect(rawPage.getByRole('heading', { name: '我的看板' })).toBeVisible();
  await expect(rawPage.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect
    .poll(async () =>
      rawPage.evaluate(async () => {
        const stored = (await chrome.storage.local.get('app_state')).app_state as AppState;
        return stored.language;
      }),
    )
    .toBe('zh-CN');
  await rawPage.reload();
  await expect(rawPage.getByRole('heading', { name: '我的看板' })).toBeVisible();
  const second = await context.newPage();
  await second.goto(rawPage.url());
  await expect(second.getByRole('heading', { name: '我的看板' })).toBeVisible();
  await second.getByRole('button', { name: 'English' }).click();
  await expect(rawPage.getByRole('heading', { name: 'My boards' })).toBeVisible();
});
test('English labels cover editing, details, settings, bookmarks, and import preview', async ({
  rawPage,
}) => {
  await rawPage.getByRole('button', { name: 'New board', exact: true }).first().click();
  await expect(rawPage.getByRole('dialog')).toContainText('Board name');
  await rawPage.getByLabel('Board name').fill('Work');
  await rawPage.getByRole('button', { name: 'Save board' }).click();
  await rawPage.getByRole('button', { name: 'Add card to bottom' }).click();
  await expect(rawPage.getByRole('dialog')).toContainText('Card title');
  await rawPage.getByLabel('Card title').fill('Task');
  await rawPage.getByRole('button', { name: 'Save card' }).click();
  await rawPage.getByRole('button', { name: 'Task', exact: true }).click();
  await expect(rawPage.getByRole('dialog')).toContainText('Card details');
  await rawPage.getByRole('button', { name: 'Close dialog' }).click();
  await rawPage.getByRole('button', { name: 'Quick links' }).click();
  await expect(rawPage.getByRole('dialog')).toContainText('Add link');
  await rawPage.getByRole('button', { name: 'Close quick links' }).click();
  await rawPage.getByRole('button', { name: 'Settings' }).click();
  await rawPage.getByRole('button', { name: 'Import / Export' }).click();
  await expect(rawPage.getByRole('dialog')).toContainText('Export full backup');
  await rawPage.getByLabel('Choose JSON file').setInputFiles({
    name: 'legacy.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(legacy())),
  });
  await expect(rawPage.getByRole('dialog')).toContainText('Import preview');
  await expect(rawPage.getByRole('dialog')).toContainText('The original export has no bookmarks');
});
test('language switch remains keyboard operable at phone width and failed writes keep English', async ({
  rawPage,
}) => {
  await rawPage.setViewportSize({ width: 375, height: 800 });
  const chinese = rawPage.getByRole('button', { name: '简体中文' });
  await expect(chinese).toBeVisible();
  const clockLines = await rawPage.locator('.clock time, .clock span').evaluateAll((elements) =>
    elements.map((element) => ({
      height: element.getBoundingClientRect().height,
      fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
    })),
  );
  expect(clockLines.every(({ height, fontSize }) => height <= fontSize * 1.6)).toBe(true);
  await rawPage.getByRole('textbox', { name: 'Search the web' }).fill('unfinished query');
  await rawPage.evaluate(() => {
    const send = chrome.runtime.sendMessage.bind(chrome.runtime);
    chrome.runtime.sendMessage = ((message: { type?: string; operation?: { type?: string } }) =>
      message.type === 'dispatch' && message.operation?.type === 'language'
        ? Promise.reject(new Error('test write failed'))
        : send(message)) as typeof chrome.runtime.sendMessage;
  });
  await chinese.focus();
  await rawPage.keyboard.press('Enter');
  await expect(rawPage.getByRole('heading', { name: 'My boards' })).toBeVisible();
  await expect(rawPage.getByRole('alert')).toContainText('Something went wrong');
  await expect(rawPage.getByRole('textbox', { name: 'Search the web' })).toHaveValue(
    'unfinished query',
  );
});
test('another tab changes open dialog copy without discarding an editor draft', async ({
  rawPage,
  context,
}) => {
  await rawPage.getByRole('button', { name: 'New board', exact: true }).first().click();
  await rawPage.getByLabel('Board name').fill('Work');
  await rawPage.getByRole('button', { name: 'Save board' }).click();
  await rawPage.getByRole('button', { name: 'Edit board' }).click();
  await rawPage.getByLabel('Board name').fill('Unsaved draft');
  const second = await context.newPage();
  await second.goto(rawPage.url());
  await second.getByRole('button', { name: '简体中文' }).click();
  await expect(rawPage.getByLabel('看板名称')).toHaveValue('Unsaved draft');
  await rawPage.getByRole('button', { name: '取消' }).click();
  await rawPage.getByRole('button', { name: '删除看板' }).click();
  await expect(rawPage.getByRole('dialog')).toContainText('删除“Work”及其 0 张卡片？');
  await second.getByRole('button', { name: 'English' }).click();
  await expect(rawPage.getByRole('dialog')).toContainText('Delete “Work” and its 0 cards?');
});
test('search engine selector fills the search field vertically', async ({ page }) => {
  for (const width of [1280, 375]) {
    await page.setViewportSize({ width, height: 800 });
    const bounds = await page.evaluate(() => {
      const box = document.querySelector('.search-box');
      const selector = box?.querySelector('select');
      if (!box || !selector) throw new Error('Search controls are missing');
      const outer = box.getBoundingClientRect();
      const inner = selector.getBoundingClientRect();
      return { topGap: inner.top - outer.top, bottomGap: outer.bottom - inner.bottom };
    });
    expect(bounds.topGap).toBeLessThanOrEqual(1.5);
    expect(bounds.bottomGap).toBeLessThanOrEqual(1.5);
  }
});
test('existing app_state opens and edits without resetting revision or unknown fields', async ({
  page,
}) => {
  const sample = legacy();
  const { language: _language, ...oldBase } = emptyState();
  const oldState = {
    ...oldBase,
    revision: 17,
    data: { boards: sample.boards, cards: sample.cards, boardOrder: sample.boardOrder },
    custom: { nested: [null, 'keep'] },
  };
  await page.evaluate((state) => chrome.storage.local.set({ app_state: state }), oldState);
  await page.reload();
  await expect(page.getByRole('heading', { name: '工作', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '检查导出', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit card' }).click();
  await page.getByLabel('Card title').fill('迁移后编辑');
  await page.getByRole('button', { name: 'Save card' }).click();
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
test('drop shows the new card order before a delayed background write completes', async ({
  page,
}) => {
  await addBoard(page);
  await addCard(page, '甲');
  await addCard(page, '乙');
  await page.evaluate(() => {
    const send = chrome.runtime.sendMessage.bind(chrome.runtime);
    chrome.runtime.sendMessage = ((message: unknown) =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          send(message).then(resolve, reject);
        }, 1000);
      })) as typeof chrome.runtime.sendMessage;
  });
  await page.locator('.task-card').first().focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  expect(await page.locator('.task-card .card-title').allTextContents()).toEqual(['乙', '甲']);
  await expect(page.locator('.task-card .card-title')).toHaveText(['乙', '甲']);
  await expect
    .poll(async () =>
      page.evaluate(async () => {
        const stored = (await chrome.storage.local.get('app_state')).app_state as AppState;
        return stored.data.boards[stored.data.boardOrder[0]].cardIds.map(
          (id) => stored.data.cards[id].title,
        );
      }),
    )
    .toEqual(['乙', '甲']);
});
test('a failed drag save restores the persisted order', async ({ page }) => {
  await addBoard(page);
  await addCard(page, '甲');
  await addCard(page, '乙');
  await page.evaluate(() => {
    const send = chrome.runtime.sendMessage.bind(chrome.runtime);
    chrome.runtime.sendMessage = ((message: { type?: string; operation?: { type?: string } }) =>
      message.type === 'dispatch' && message.operation?.type === 'card.move'
        ? Promise.reject(new Error('测试保存失败'))
        : send(message)) as typeof chrome.runtime.sendMessage;
  });
  await page.locator('.task-card').first().focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await expect(page.locator('.task-card .card-title')).toHaveText(['甲', '乙']);
  await expect(page.getByRole('alert')).toContainText('测试保存失败');
});
test('drag preview makes room and highlights the destination list', async ({ page }) => {
  await addBoard(page, 'A');
  await addBoard(page, 'B');
  await addCard(page, '预览卡片');
  const source = page.locator('.task-card');
  const destination = page.locator('.board').nth(1).locator('.board-card-list');
  const sourceBox = await source.boundingBox();
  const destinationBox = await destination.boundingBox();
  if (!sourceBox || !destinationBox) throw new Error('拖动区域不可见');
  const idleShadow = await source.evaluate((element) => getComputedStyle(element).boxShadow);
  const idleBackground = await destination.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    destinationBox.x + destinationBox.width / 2,
    destinationBox.y + destinationBox.height / 2,
    { steps: 15 },
  );
  await expect(source).toHaveClass(/dragging/);
  await expect(destination).toHaveClass(/drag-over/);
  await expect(destination.locator('[data-rfd-placeholder-context-id]')).toBeVisible();
  expect(await source.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe(
    idleShadow,
  );
  expect(
    await destination.evaluate((element) => getComputedStyle(element).backgroundColor),
  ).not.toBe(idleBackground);
  await page.mouse.up();
});
test('dropping outside a list leaves the stored card order unchanged', async ({ page }) => {
  await addBoard(page);
  await addCard(page, '甲');
  await addCard(page, '乙');
  const before = (await page.evaluate(
    async () => (await chrome.storage.local.get('app_state')).app_state,
  )) as AppState;
  await page.locator('.task-card').first().dragTo(page.locator('.topbar'), { steps: 12 });
  const after = (await page.evaluate(
    async () => (await chrome.storage.local.get('app_state')).app_state,
  )) as AppState;
  expect(after.revision).toBe(before.revision);
  expect(after.data.boards[before.data.boardOrder[0]].cardIds).toEqual(
    before.data.boards[before.data.boardOrder[0]].cardIds,
  );
});
test('hidden completed cards cannot be dragged and hidden boards do not shift visible targets', async ({
  page,
}) => {
  const sample = emptyState();
  sample.language = 'zh-CN';
  sample.options.hideCompletedCards = true;
  sample.data = {
    boardOrder: ['a', 'hidden', 'b'],
    boards: {
      a: { id: 'a', title: 'A', cardIds: ['todo', 'done'] },
      hidden: { id: 'hidden', title: '隐藏', cardIds: [], isHidden: true },
      b: { id: 'b', title: 'B', cardIds: [] },
    },
    cards: {
      todo: { id: 'todo', title: '待办' },
      done: { id: 'done', title: '完成', completed: true },
    },
  };
  await page.evaluate((state) => chrome.storage.local.set({ app_state: state }), sample);
  await page.reload();
  await page.getByRole('button', { name: '显示完成项' }).click();
  const done = page
    .locator('.task-card')
    .filter({ has: page.getByRole('button', { name: '完成', exact: true }) });
  await done.dragTo(page.locator('.board').nth(1).locator('.board-card-list'), { steps: 12 });
  let stored = (await page.evaluate(
    async () => (await chrome.storage.local.get('app_state')).app_state,
  )) as AppState;
  expect(stored.data.boards.a.cardIds).toEqual(['todo', 'done']);
  await page
    .locator('.board')
    .nth(1)
    .locator('.board-header')
    .dragTo(page.locator('.board').first().locator('.board-header'), { steps: 12 });
  await expect(page.locator('.board h2')).toHaveText(['B', 'A']);
  stored = (await page.evaluate(
    async () => (await chrome.storage.local.get('app_state')).app_state,
  )) as AppState;
  expect(stored.data.boardOrder).toEqual(['b', 'a', 'hidden']);
});
test('cross-board drag inserts before hidden completed cards', async ({ page }) => {
  const sample = emptyState();
  sample.options.hideCompletedCards = true;
  sample.data = {
    boardOrder: ['a', 'b'],
    boards: {
      a: { id: 'a', title: 'A', cardIds: ['move'] },
      b: { id: 'b', title: 'B', cardIds: ['existing', 'done'] },
    },
    cards: {
      move: { id: 'move', title: '移动' },
      existing: { id: 'existing', title: '已有' },
      done: { id: 'done', title: '完成', completed: true },
    },
  };
  await page.evaluate((state) => chrome.storage.local.set({ app_state: state }), sample);
  await page.reload();
  await page.locator('.board').first().locator('.task-card').focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await expect(page.locator('.board').nth(1).locator('.task-card .card-title')).toHaveText([
    '已有',
    '移动',
  ]);
  const stored = (await page.evaluate(
    async () => (await chrome.storage.local.get('app_state')).app_state,
  )) as AppState;
  expect(stored.data.boards.b.cardIds).toEqual(['existing', 'move', 'done']);
});
test('board drag works through horizontal overflow and leaves controls usable', async ({
  page,
}) => {
  for (const title of ['A', 'B', 'C', 'D', 'E']) await addBoard(page, title);
  await page.locator('.board-header').last().focus();
  await page.keyboard.press('Space');
  for (let index = 0; index < 4; index++) await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Space');
  await expect(page.locator('.board h2')).toHaveText(['E', 'A', 'B', 'C', 'D']);
  await page.locator('.board').first().getByRole('button', { name: '添加卡片到顶部' }).click();
  await expect(page.getByLabel('卡片标题')).toBeVisible();
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
