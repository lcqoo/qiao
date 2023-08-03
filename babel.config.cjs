module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false, // 启用将 ES 模块语法转换为其他模块类型
        useBuiltIns: 'usage',
        corejs: '3',
      },
    ],
  ],
};
