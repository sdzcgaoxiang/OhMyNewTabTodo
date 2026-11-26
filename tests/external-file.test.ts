import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState } from '../src/model.ts';
import { writeSnapshot } from '../src/external-file.ts';

test('a failed file commit does not report success and aborts the stream', async () => {
  let aborted = false;
  const handle = {
    createWritable: async () => ({
      write: async () => {},
      close: async () => {
        throw new Error('disk full');
      },
      abort: async () => {
        aborted = true;
      },
    }),
  };
  await assert.rejects(() => writeSnapshot(handle, emptyState(), 'id'), /disk full/);
  assert.equal(aborted, true);
});

test('the file receives a complete versioned snapshot', async () => {
  let data = '';
  const handle = {
    createWritable: async () => ({
      write: async (s: string) => {
        data = s;
      },
      close: async () => {},
      abort: async () => {},
    }),
  };
  await writeSnapshot(handle, emptyState(), 'id');
  assert.equal(JSON.parse(data).format, 'ohmynewtabtodo.readonly');
  assert.equal(JSON.parse(data).source.instanceId, 'id');
});
