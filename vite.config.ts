import { fileURLToPath, URL } from "node:url";
const {resolve} = require('path')

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  base: "./",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // 构建为库，只生成一个js文件
  build: {
    // outDir: 'dist/',
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 0,
    lib: {
      name: 'gpt',
      formats: ['umd'],
      entry: resolve(__dirname, 'src/main.ts'),
      fileName: (format) => `js.${format}.js`
    },
  }
});
