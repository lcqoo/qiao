/* eslint-env node */
import '@rushstack/eslint-patch/modern-module-resolution';

export default {
  root: true,
  extends: ['plugin:vue/vue3-essential', 'eslint:recommended', '@vue/eslint-config-prettier/skip-formatting'],
  plugins: ['prettier', 'vue'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    /**
     * 关闭规则: off 或 0;
     * 开启规则(使用警告级别, 不会导致程序退出): warn 或 1;
     * 开启规则(使用错误级别, 会导致程序退出): error 或 2;
     */
    //
    'prettier/prettier': ['warn'],
    /**
     * 这些规则与 JavaScript 代码中可能的错误或逻辑错误有关：
     */
    'no-empty': 1, // 禁止出现空语句块
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    /**
     * 这些规则与变量声明有关：
     */
    'no-undef': 1, // 禁用未声明的变量，除非它们在 /*global */ 注释中被提到
    'no-unused-vars': 0, // 禁止出现未使用过的变量
    /**
     * 这些规则是关于最佳实践的，帮助你避免一些问题
     */
    'no-useless-escape': 1, // 禁用不必要的转义字符
    /**
     * 这些规则是关于风格指南的，而且是非常主观的
     */
    'operator-assignment': [1, 'always'], // 要求或禁止在可能的情况下使用简化的赋值操作符
  },
};
