import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({
  base: './',
  build: { rollupOptions: {
    input: { newtab: resolve('index.html'), background: resolve('src/background.js') },
    output: { entryFileNames: chunk => chunk.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js' },
  } },
});
