import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const run = (file: string, ...args: string[]) =>
  execFileSync(process.execPath, ['cli/omntt.mjs', ...args, '--file', file, '--json'], {
    encoding: 'utf8',
  });

test('CLI reads and filters snapshots without modifying the file', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'omntt-cli-'));
  try {
    const file = join(dir, 'todos.json');
    const snapshot = {
      format: 'ohmynewtabtodo.readonly',
      formatVersion: 1,
      source: { instanceId: 'local', appVersion: '0.4.0', revision: 4 },
      exportedAt: '2026-11-09T00:00:00Z',
      data: {
        boardOrder: ['b'],
        boards: { b: { id: 'b', title: 'Work', cardIds: ['a', 'c'] } },
        cards: {
          a: { id: 'a', title: 'Open', completed: false },
          c: { id: 'c', title: 'Done', completed: true },
        },
      },
    };
    const original = JSON.stringify(snapshot);
    await writeFile(file, original);
    assert.deepEqual(
      JSON.parse(run(file, 'boards')).map((b: { id: string }) => b.id),
      ['b'],
    );
    assert.deepEqual(
      JSON.parse(run(file, 'tasks', '--status', 'pending')).map((c: { id: string }) => c.id),
      ['a'],
    );
    assert.equal(JSON.parse(run(file, 'task', 'c')).title, 'Done');
    assert.equal(JSON.parse(run(file, 'status')).revision, 4);
    assert.equal(await readFile(file, 'utf8'), original);
    const missing = spawnSync(
      process.execPath,
      ['cli/omntt.mjs', 'task', 'missing', '--file', file, '--json'],
      { encoding: 'utf8' },
    );
    assert.notEqual(missing.status, 0);
    assert.equal(missing.stdout, '');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('explicit file overrides a broken configuration and unsupported snapshots fail', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'omntt-cli-config-'));
  try {
    const { mkdir } = await import('node:fs/promises');
    await mkdir(join(dir, 'omntt'));
    await writeFile(join(dir, 'omntt', 'config.json'), '{bad');
    const file = join(dir, 'snapshot.json');
    await writeFile(
      file,
      JSON.stringify({
        format: 'ohmynewtabtodo.readonly',
        formatVersion: 1,
        source: { instanceId: 'local', appVersion: '0.4.0', revision: 5 },
        exportedAt: '2026-11-09T00:00:00Z',
        data: { boards: {}, cards: {}, boardOrder: [] },
      }),
    );
    const env = { ...process.env, XDG_CONFIG_HOME: dir };
    const ok = spawnSync(process.execPath, ['cli/omntt.mjs', 'status', '--file', file, '--json'], {
      encoding: 'utf8',
      env,
    });
    assert.equal(ok.status, 0);
    assert.equal(JSON.parse(ok.stdout).revision, 5);
    await writeFile(file, JSON.stringify({ format: 'ohmynewtabtodo.readonly', formatVersion: 2 }));
    const bad = spawnSync(process.execPath, ['cli/omntt.mjs', 'tasks', '--file', file, '--json'], {
      encoding: 'utf8',
      env,
    });
    assert.notEqual(bad.status, 0);
    assert.equal(bad.stdout, '');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('rejects snapshots with arrays instead of task maps', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'omntt-invalid-'));
  try {
    const file = join(dir, 'bad.json');
    await writeFile(
      file,
      JSON.stringify({
        format: 'ohmynewtabtodo.readonly',
        formatVersion: 1,
        source: {},
        data: { boards: [], cards: [], boardOrder: [] },
      }),
    );
    const result = spawnSync(
      process.execPath,
      ['cli/omntt.mjs', 'tasks', '--file', file, '--json'],
      { encoding: 'utf8' },
    );
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout, '');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('rejects invalid completion states and missing snapshot provenance', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'omntt-invalid-fields-'));
  try {
    const file = join(dir, 'bad.json');
    const snapshot = {
      format: 'ohmynewtabtodo.readonly',
      formatVersion: 1,
      source: { instanceId: 'fixture', appVersion: '0.4.0', revision: 1 },
      exportedAt: '2026-11-10T00:00:00.000Z',
      data: {
        boardOrder: [],
        boards: {},
        cards: { a: { id: 'a', title: 'Task', completed: 'true' } },
      },
    };
    await writeFile(file, JSON.stringify(snapshot));
    const invalidCompletion = spawnSync(
      process.execPath,
      ['cli/omntt.mjs', 'tasks', '--status', 'pending', '--file', file, '--json'],
      { encoding: 'utf8' },
    );
    assert.notEqual(invalidCompletion.status, 0);
    assert.equal(invalidCompletion.stdout, '');
    await writeFile(
      file,
      JSON.stringify({
        ...snapshot,
        source: {},
        data: { boardOrder: [], boards: {}, cards: {} },
        exportedAt: undefined,
      }),
    );
    const missingProvenance = spawnSync(
      process.execPath,
      ['cli/omntt.mjs', 'status', '--file', file, '--json'],
      { encoding: 'utf8' },
    );
    assert.notEqual(missingProvenance.status, 0);
    assert.equal(missingProvenance.stdout, '');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('rejects board ordering that references a missing board', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'omntt-invalid-order-'));
  try {
    const file = join(dir, 'bad.json');
    await writeFile(
      file,
      JSON.stringify({
        format: 'ohmynewtabtodo.readonly',
        formatVersion: 1,
        source: { instanceId: 'fixture', appVersion: '0.4.0', revision: 1 },
        exportedAt: '2026-11-10T00:00:00Z',
        data: { boardOrder: ['missing'], boards: {}, cards: {} },
      }),
    );
    const result = spawnSync(
      process.execPath,
      ['cli/omntt.mjs', 'boards', '--file', file, '--json'],
      { encoding: 'utf8' },
    );
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout, '');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
