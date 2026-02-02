import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'url';
import svgLoader from 'vite-svg-loader';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [
    vue(),
    svgLoader(),
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
    },
  },
  resolve: {
    alias: [
      { find: 'InvestCommon', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: 'UiKit', replacement: path.resolve(__dirname, '../ui-kit/src') },
      { find: /^@vueuse\/integrations\/(.*)$/, replacement: '@vueuse/integrations/$1.js' },
      { find: /^pinia$/, replacement: path.resolve(__dirname, './node_modules/pinia/dist/pinia.mjs') },
      { find: /^vue-router$/, replacement: path.resolve(__dirname, './test/mocks/vue-router.ts') },
    ],
  },
});
