import { fileURLToPath, URL } from 'node:url';
import path from 'path';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

import babel from 'vite-plugin-babel';

import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

import Inspect from 'vite-plugin-inspect';

const pathSrc = path.resolve(__dirname, 'src');

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    babel(),
    vue(),

    // 按需自动导入 ElementPlus
    AutoImport({
      // Auto import functions from Vue, e.g. ref, reactive, toRef...
      // 自动导入 Vue 相关函数，如：ref, reactive, toRef 等
      imports: ['vue'],

      // Auto import functions from Element Plus, e.g. ElMessage, ElMessageBox... (with style)
      // 自动导入 Element Plus 相关函数，如：ElMessage, ElMessageBox... (带样式)
      resolvers: [
        ElementPlusResolver(),

        // Auto import icon components
        // 自动导入图标组件
        IconsResolver({
          prefix: 'Icon',
        }),
      ],

      dts: path.resolve(pathSrc, 'auto-imports.d.ts'),
    }),

    Components({
      resolvers: [
        // Auto register icon components
        // 自动注册图标组件
        IconsResolver({
          // prefix: 'icon', // 自动引入的Icon组件统一前缀，默认为 i，设置false为不需要前缀
          // {prefix}-{collection}-{icon} 使用组件解析器时，您必须遵循名称转换才能正确推断图标。
          // alias: { park: 'icon-park' } 集合的别名
          enabledCollections: ['ep'], // 这是可选的，默认启用 Iconify 支持的所有集合['mdi']
        }),
        // Auto register Element Plus components
        // 自动导入 Element Plus 组件
        ElementPlusResolver(),
      ],

      dts: path.resolve(pathSrc, 'components.d.ts'),
    }),

    Icons({
      // scale: 1, // 缩放
      compiler: 'vue3', // 编译方式
      // defaultClass: '', // 默认类名
      // defaultStyle: '', // 默认样式
      autoInstall: true,
      // jsx: 'react' // jsx支持
    }),

    Inspect(),
  ],
  css: {
    // preprocessorOptions: {
    //   // 全局scss变量引入
    //   scss: {
    //     // 这样就可以在全局中使用 variables.scss 中预定义的变量了, 注意最后需要添加 ';'
    //     additionalData: '@import "@/assets/css/variables.scss";',
    //     // javascriptEnabled: true,
    //   },
    // },
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
