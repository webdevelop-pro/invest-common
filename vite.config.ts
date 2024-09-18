import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(), 
    svgLoader({
      svgo: false,
    }),
  ],
  resolve: {
    alias: {
      // "@": join(__dirname, "src"),
      'InvestCommon': path.resolve(__dirname, './src'),
      'UiKit': path.resolve(__dirname, './ui-kit/src')
    }
  },
})
