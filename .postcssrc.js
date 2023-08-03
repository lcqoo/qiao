import autoprefixer from 'autoprefixer';
import postcssPresetEnv from 'postcss-preset-env';
// import pxtorem from 'postcss-pxtorem';

export default {
  // 不生成 sourcemaps
  // map: false,

  plugins: [
    // 自动添加浏览器前缀
    autoprefixer,

    // 使用新语法
    postcssPresetEnv({
      stage: 0,
    }),

    // 单位转换：px->rem
    // pxtorem,
  ],
};
