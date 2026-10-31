import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

test('release archive includes only extension assets with a matching checksum; rejects stray private files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ohmynewtab-package-'));
  try {
    await mkdir(join(root, 'dist/assets'), { recursive: true });
    await mkdir(join(root, 'dist/_locales/en'), { recursive: true });
    await mkdir(join(root, 'dist/_locales/zh_CN'), { recursive: true });
    for (const [name, text] of Object.entries({
      'package.json': JSON.stringify({ version: '0.1.0' }),
      'dist/manifest.json': JSON.stringify({
        version: '0.1.0',
        manifest_version: 3,
        default_locale: 'en',
      }),
      'dist/index.html': '<html></html>',
      'dist/background.js': '// background',
      'dist/LICENSE.txt': 'MIT License and dependency notices',
      'dist/assets/app.js': '// app',
      'dist/_locales/en/messages.json': JSON.stringify({
        extensionDescription: { message: 'Tasks' },
      }),
      'dist/_locales/zh_CN/messages.json': JSON.stringify({
        extensionDescription: { message: '待办' },
      }),
      'private.json': 'do not ship',
    }))
      await writeFile(join(root, name), text);
    const script = resolve('scripts/package.mjs');
    const run = () => spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8' });
    const result = run();
    assert.equal(result.status, 0, result.stderr);
    const filename = 'OhMyNewTabTodo-0.1.0.zip';
    const archive = join(root, 'release', filename);
    assert.deepEqual(
      execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8' }).trim().split('\n'),
      [
        'LICENSE.txt',
        '_locales/en/messages.json',
        '_locales/zh_CN/messages.json',
        'assets/app.js',
        'background.js',
        'index.html',
        'manifest.json',
      ],
    );
    const hash = createHash('sha256')
      .update(await readFile(archive))
      .digest('hex');
    assert.equal(
      await readFile(join(root, 'release/SHA256SUMS.txt'), 'utf8'),
      `${hash}  ${filename}\n`,
    );
    await writeFile(join(root, 'dist/private.json'), 'do not ship');
    const rejected = run();
    assert.notEqual(rejected.status, 0);
    assert.match(rejected.stderr, /Unexpected build file/);
    await rm(join(root, 'dist/private.json'));
    await writeFile(join(root, 'dist/assets/unexpected.ts'), 'export {}');
    const sourceRejected = run();
    assert.notEqual(sourceRejected.status, 0);
    assert.match(sourceRejected.stderr, /Unexpected build file: assets\/unexpected\.ts/);
    await rm(join(root, 'dist/assets/unexpected.ts'));
    await writeFile(join(root, 'dist/_locales/en/private.json'), 'do not ship');
    const localeRejected = run();
    assert.notEqual(localeRejected.status, 0);
    assert.match(localeRejected.stderr, /Unexpected build file: _locales\/en\/private\.json/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('manifest metadata has complete English and Chinese catalogs', async () => {
  const manifest = JSON.parse(await readFile(resolve('public/manifest.json'), 'utf8'));
  assert.equal(manifest.default_locale, 'en');
  assert.equal(manifest.description, '__MSG_extensionDescription__');
  assert.equal(manifest.action.default_title, '__MSG_actionTitle__');
  for (const locale of ['en', 'zh_CN']) {
    const messages = JSON.parse(
      await readFile(resolve(`public/_locales/${locale}/messages.json`), 'utf8'),
    );
    assert.ok(messages.extensionDescription.message);
    assert.ok(messages.actionTitle.message);
  }
});
