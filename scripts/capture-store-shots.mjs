// Captures Chrome Web Store screenshots (1280x800) from the built extension in
// dist/ using synthetic boards and cards only. Run `npm run build` first.
//
//   node scripts/capture-store-shots.mjs
import { chromium } from '@playwright/test';
import path from 'node:path';

const extensionPath = path.resolve('dist');
const outDir = path.resolve('docs/store/images');

const localDate = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
};

const syntheticState = (language, theme) => {
  const zh = language === 'zh-CN';
  return {
    schemaVersion: 1,
    revision: 0,
    language,
    theme,
    options: {
      allDayReminders: true,
      playSoundEffects: true,
      allowHidingBoard: true,
      hideCardDescription: false,
      linkFormatting: true,
      dimCompletedCards: true,
      hideCompletedCards: false,
      showCompactCards: false,
      hideGoogleSearch: false,
      hideDuckDuckGoSearch: true,
      hideBingSearch: true,
      hideYoutubeSearch: false,
      showClock: true,
      twentyFourHours: false,
      pinClock: true,
    },
    bookmarks: [],
    backups: [],
    imports: [],
    data: {
      boardOrder: ['work', 'personal', 'week'],
      boards: {
        work: { id: 'work', title: zh ? '工作' : 'Work', cardIds: ['w1', 'w2'] },
        personal: { id: 'personal', title: zh ? '个人' : 'Personal', cardIds: ['p1', 'p3'] },
        week: { id: 'week', title: zh ? '本周' : 'This week', cardIds: ['k1', 'k2'] },
      },
      cards: {
        w1: {
          id: 'w1',
          title: zh ? '整理下季度的路线图' : 'Draft next quarter roadmap',
          description: zh
            ? '先列目标，再拆成可交付的小步'
            : 'List goals, then break them into deliverables',
          priority: 'high',
          dueDate: localDate(),
          createdAt: '2026-11-20T09:12:00.000Z',
        },
        w2: {
          id: 'w2',
          title: zh ? '回复设计评审反馈' : 'Reply to design review',
          priority: 'normal',
          dueDate: localDate(1),
          dueTime: '09:30',
          createdAt: '2026-11-21T14:05:00.000Z',
        },
        p1: {
          id: 'p1',
          title: zh ? '读书 20 分钟' : 'Read for 20 minutes',
          description: zh ? '随便一本好书都行' : 'Any good book counts',
          createdAt: '2026-11-22T08:00:00.000Z',
        },
        p3: {
          id: 'p3',
          title: zh ? '整理书桌' : 'Tidy the desk',
          completed: true,
          createdAt: '2026-11-18T10:40:00.000Z',
        },
        k1: {
          id: 'k1',
          title: zh ? '预约年度体检' : 'Book annual check-up',
          dueDate: localDate(2),
          createdAt: '2026-11-23T16:20:00.000Z',
        },
        k2: {
          id: 'k2',
          title: zh ? '给家里打个电话' : 'Call home',
          priority: 'low',
          createdAt: '2026-11-24T12:00:00.000Z',
        },
      },
    },
  };
};

async function capture(language, theme, file) {
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  try {
    let [worker] = context.serviceWorkers();
    if (!worker) worker = await context.waitForEvent('serviceworker');
    const id = new URL(worker.url()).host;
    const page = await context.newPage();
    await page.goto(`chrome-extension://${id}/index.html`);
    await page.evaluate(
      (state) => chrome.storage.local.set({ app_state: state }),
      syntheticState(language, theme),
    );
    await page.reload();
    await page
      .getByRole('button', { name: language === 'zh-CN' ? '新建看板' : 'New board' })
      .waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, file) });
    console.log(`captured ${file}`);
  } finally {
    await context.close();
  }
}

await capture('zh-CN', 'dark', 'screenshot-zh.png');
await capture('en', 'dark', 'screenshot-en.png');
await capture('zh-CN', 'light', 'screenshot-zh-light.png');
await capture('en', 'light', 'screenshot-en-light.png');
