import { test, expect, chromium, type BrowserContext, type Page } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

async function openExtension(context: BrowserContext): Promise<Page> {
  let [worker] = context.serviceWorkers();
  if (!worker) worker = await context.waitForEvent('serviceworker');
  const page = await context.newPage();
  await page.goto(`chrome-extension://${new URL(worker.url()).host}/index.html`);
  return page;
}

test('synthetic file handle and snapshots survive a browser restart', async () => {
  const profile = await mkdtemp(path.join(tmpdir(), 'omntt-restart-'));
  const extensionPath = path.resolve('dist');
  const launch = () =>
    chromium.launchPersistentContext(profile, {
      channel: 'chromium',
      headless: true,
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
  let context: BrowserContext | undefined;
  try {
    context = await launch();
    let page = await openExtension(context);
    await page.evaluate(() => {
      Object.defineProperty(window, 'showOpenFilePicker', {
        configurable: true,
        value: async () => {
          const root = await navigator.storage.getDirectory();
          return [await root.getFileHandle('restart-synthetic.json', { create: true })];
        },
      });
    });
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('button', { name: 'Import / Export', exact: true }).click();
    await page.getByRole('button', { name: 'Choose data file' }).click();
    await expect(page.getByText(/Enabled/)).toBeVisible();
    const initial = await page.evaluate(async () => {
      const root = await navigator.storage.getDirectory();
      return JSON.parse(
        await (await (await root.getFileHandle('restart-synthetic.json')).getFile()).text(),
      );
    });
    await context.close();
    context = await launch();
    page = await openExtension(context);
    await page.getByRole('button', { name: 'New board', exact: true }).first().click();
    await page.getByLabel('Board name').fill('Restart synthetic board');
    await page.getByRole('button', { name: 'Save board' }).click();
    await expect
      .poll(async () =>
        page.evaluate(async () => {
          const root = await navigator.storage.getDirectory();
          return JSON.parse(
            await (await (await root.getFileHandle('restart-synthetic.json')).getFile()).text(),
          );
        }),
      )
      .toMatchObject({
        source: { instanceId: initial.source.instanceId },
        data: { boardOrder: expect.any(Array) },
      });
    await expect
      .poll(async () =>
        page.evaluate(async () => {
          const root = await navigator.storage.getDirectory();
          const data = JSON.parse(
            await (await (await root.getFileHandle('restart-synthetic.json')).getFile()).text(),
          );
          return Object.values(data.data.boards).some(
            (board) => (board as { title: string }).title === 'Restart synthetic board',
          );
        }),
      )
      .toBe(true);
  } finally {
    await context?.close();
    await rm(profile, { recursive: true, force: true });
  }
});
