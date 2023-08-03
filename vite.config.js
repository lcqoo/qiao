import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import babel from 'vite-plugin-babel';
import usePluginImport from 'vite-plugin-importer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    babel(),
    vue(),
    usePluginImport({
      libraryName: 'element-plus',
      customStyleName: (name) => {
        return `element-plus/lib/theme-chalk/${name}.css`;
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // build: {
  //   target: 'es2020',
  // },
  server: {
    host: '0.0.0.0',
    port: '8082',
    https: false,
    open: false,
  },
  // 设置反向代理，跨域
  // proxy: {
  //   '/api': {
  //     target: '',
  //     changeOrigin: true,
  //   },
  // },
});
