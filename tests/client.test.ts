import test from 'node:test';
import assert from 'node:assert/strict';

test('client rejects a successful response without state data', async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'chrome');
  Object.defineProperty(globalThis, 'chrome', {
    configurable: true,
    value: { runtime: { id: 'test-extension', sendMessage: async () => ({ ok: true }) } },
  });
  try {
    const { readState } = await import('../src/client.ts');
    await assert.rejects(readState(), /后台|响应|数据/);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'chrome', previous);
    else Reflect.deleteProperty(globalThis, 'chrome');
  }
});
