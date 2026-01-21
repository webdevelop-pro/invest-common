import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'url';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
    },
  },
  resolve: {
    alias: {
      InvestCommon: fileURLToPath(new URL('./src', import.meta.url)),
      UiKit: path.resolve(__dirname, '../ui-kit/src'),
    },
  },
});
