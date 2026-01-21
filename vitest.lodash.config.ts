import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'url';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: [
      { find: /^lodash-es$/, replacement: 'lodash' },
      { find: /^lodash-es\/(.*)\.js$/, replacement: 'lodash/$1.js' },
      { find: /^lodash-es\/(.*)$/, replacement: 'lodash/$1' },
    ],
    coverage: {
      provider: 'v8',
    },
  },
  resolve: {
    alias: [
      { find: /^lodash-es$/, replacement: 'lodash' },
      { find: /^lodash-es\/(.*)\.js$/, replacement: 'lodash/$1.js' },
      { find: /^lodash-es\/(.*)$/, replacement: 'lodash/$1' },
      { find: 'InvestCommon', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: 'UiKit', replacement: path.resolve(__dirname, '../ui-kit/src') },
    ],
  },
});
