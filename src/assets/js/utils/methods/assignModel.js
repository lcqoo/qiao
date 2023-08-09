'use strict';
/**
 * 表单模型的数据操作
 * liuchunqiao
 */

/**
 * 盖写表单数据的入口函数
 * 主要功能1: 遍历表单模型对象, 取数据对象 data 里的对应的值覆盖;
 * 主要功能2: 通过配置 options.config 改变 model 里字段对应 data 里字段的路径名称, 属性字段的精细控制等;
 * 主要功能3: options.reverse=true 可通过配置 options.config 用 model 方向盖写 data (一般用于生成保存的数据).
 * @param {Object} model 表单模型
 * @param {Object} data 数据
 * @param {Object} options 拓展选项, 详见: optionProps
 */
const assignModel = function (model, data, options) {
  if (!model) {
    console.error(new Error(`${LOG_PREFIX}-无效的参数-model`));
    return;
  }

  options = filterOptions(options);

  // 选项的校验和取值
  const topOpts = getValidateOpts(optTopStateKeys, options, true);
  // 顶层状态
  const topState = new RunState(topOpts);
  // 状态
  const state = createState(topState);

  const modelOpts = getValidateOpts(optModelUsableKeys, options, true);

  return assignMethod(state, model, data, modelOpts);
};

// 打印时的开头
const LOG_PREFIX = 'assignModel';

// 开发环境
const isDev = process.env.NODE_ENV === 'development';

// 是否可以打断点
const canDebugger = isDev;

// 记录重定向的标记
const trackRedirectSign = '@';

// 空对象
const emptyObject = Object.freeze({});

// 验证类型使用
const simpleCheckRE = /^(String|Number|Boolean|Function|Symbol)$/;

/**
 * 选项的配置信息
 * category {String} 选项的特性
 * validValues {Array} 有哪些有效值
 */
const CATEGORY_TOP = 'top'; // 全局的顶层输入的选项
const CATEGORY_INHERITABLE = 'inheritable'; // 可继承的选项
const CATEGORY_TIER = 'tier'; // 每一层的属性和模型的选项
const CATEGORY_MODEL = 'model'; // 模型的专属选项
const CATEGORY_PROP = 'prop'; // 模型属性的专属选项
const optionProps = {
  /**
   * 全局的顶层输入的选项 -------------------------------------- */

  // model反向盖写data
  reverse: {
    category: CATEGORY_TOP,
    type: Boolean,
    default: false,
  },

  // path 的分隔符
  separator: {
    category: CATEGORY_TOP,
    type: String,
    default: '.',
  },

  // 开发调试相关--匹配调试, 运行中遇到第一个匹配的 model 分支就开始打断点
  debugTarget: {
    category: CATEGORY_TOP,
    type: [Object, Array],
  },
  // debug 匹配到之后, 子孙级是否生效
  debugDescend: {
    category: CATEGORY_TOP,
    type: Boolean,
  },
  // debug 匹配到之后, 后面的同级是否生效
  debugBehind: {
    category: CATEGORY_TOP,
    type: Boolean,
  },

  /**
   * 每一层的属性和模型的选项 -------------------------------------- */

  // 开发调试相关--是否打开调试打印
  debugLog: {
    category: CATEGORY_TIER,
    type: Boolean,
    // default: true,
  },

  // 开发调试相关--是否打断点
  debugger: {
    category: CATEGORY_TIER,
    type: Boolean,
  },

  /**
   * 模型的专属选项 -------------------------------------- */

  // 模型的属性的拓展选项map
  config: {
    category: CATEGORY_MODEL,
    type: Object,
  },

  // 指定只盖写的模型属性(propKey)的集合
  include: {
    category: CATEGORY_MODEL,
    type: Array,
  },

  // 不包含的模型属性(propKey)的集合
  exclude: {
    category: CATEGORY_MODEL,
    type: Array,
  },

  // 运行中修改options的方法, 返回新的当前模型要使用的options
  modifyOptions: {
    category: CATEGORY_MODEL,
    type: Function,
  },

  /**
   * 模型的专属选项 -------------------------------------- */

  // 如何判断值是否是模型 [全局配置, 可覆盖]
  judgeModel: {
    category: CATEGORY_INHERITABLE,
    type: String,
    validValues: [
      'auto', // 根据类型判断
      'none', // 不做判断, 会导致没有设置 isModel 的属性全部都是一个判断结果
    ],
    // default: 'auto',
  },

  // 验证不通过的时候要拦截
  interceptInvalid: {
    category: CATEGORY_INHERITABLE,
    type: Boolean,
  },

  // 是否不做“类型匹配”验证, 有其他验证后也不再做
  noTypeMatch: {
    category: CATEGORY_INHERITABLE,
    type: Boolean,
  },

  // 一些方法可以访问的参数
  params: {
    category: CATEGORY_INHERITABLE,
  },

  /**
   * options.config[propKey] 模型属性的专属选项 -------------------------------------- */

  // 修改模型的属性对应 data 里的属性
  path: {
    category: CATEGORY_PROP,
    type: [String, Array],
  },

  // 指定属性是否作为模型处理, 自动判断时普通对象值会被作为模型, 不应该设置默认值
  isModel: {
    category: CATEGORY_PROP,
    type: Boolean,
  },

  // 指定模型的属性的处理顺序, 数值小的先处理; 默认值是0
  order: {
    category: CATEGORY_PROP,
    type: Number,
  },

  // 反向输出data时用来创建对象
  // createData: {
  //   category: CATEGORY_PROP,
  //   type: Function,
  // },

  // 不拦截空data
  noInterceptEmptyData: {
    category: CATEGORY_PROP,
    type: Boolean,
  },

  // 默认数据无对应属性时会中断赋值, 是否忽略
  ignoreOwnProperty: {
    category: CATEGORY_PROP,
    type: Boolean,
  },

  // 自定义拦截器, 应返回布尔值
  interceptor: {
    category: CATEGORY_PROP,
    type: Function,
  },

  // 修改值的方法, 函数返回值会作为新的值
  replace: {
    category: CATEGORY_PROP,
    type: Function,
  },

  // 自定义验证函数, 应返回布尔值
  validator: {
    category: CATEGORY_PROP,
    type: Function,
  },

  // 类型检查 (构造函数)
  type: {
    category: CATEGORY_PROP,
    type: [Function, Array],
  },

  // 不能是空值
  required: {
    category: CATEGORY_PROP,
    type: Boolean,
  },

  // 最后的赋值方法, 赋值给参数内的对象属性, 不是返回值赋值
  lastSet: {
    category: CATEGORY_PROP,
    type: Function,
  },
};

/**
 * 初始化数据: 选项key的各种分类, 简单校验
 */
const optTopStateKeys = []; // 顶层的选项
const optInheritableKeys = []; // 可继承的选项
const optTierKeys = []; // 每一层的属性和模型的选项
const optModelKeys = []; // 模型的专属选项
const optPropKeys = []; // 模型属性的专属选项
Object.keys(optionProps).forEach((key) => {
  let validateInfo = optionProps[key];
  // switch (getType(validateInfo)) {
  //   case 'Function':
  //   case 'Array':
  //     validateInfo = { type: validateInfo };
  // }
  if (!validateInfo || !validateInfo.category) {
    console.error(new Error(`${LOG_PREFIX}-选项“${key}”: 缺少必要配置, 会导致不可使用。`));
    return;
  }

  switch (validateInfo.category) {
    case CATEGORY_TOP:
      optTopStateKeys.push(key);
      break;
    case CATEGORY_INHERITABLE:
      optInheritableKeys.push(key);
      break;
    case CATEGORY_TIER:
      optTierKeys.push(key);
      break;
    case CATEGORY_MODEL:
      optModelKeys.push(key);
      break;
    case CATEGORY_PROP:
      optPropKeys.push(key);

      if (validateInfo.default !== void 0) {
        console.error(new Error(`${LOG_PREFIX}-选项“${key}”: 模型属性的专属选项, 暂不支持设置默认值。`));
      }
      break;
    default:
      console.error(new Error(`${LOG_PREFIX}-选项“${key}”: 意外的分类, 会导致不可使用。`));
      break;
  }
});
// 模型处理可收集的选项
const optModelUsableKeys = [...optInheritableKeys, ...optTierKeys, ...optModelKeys];
// 属性处理可收集的选项
const optPropUsableKeys = [...optInheritableKeys, ...optTierKeys, ...optModelKeys, ...optPropKeys];

// 获取传入值的类型
function getType(val) {
  // return Object.prototype.toString.call(val).replace(/\[(\S+) (\S+)\]/, '$2');
  return Object.prototype.toString.call(val).slice(8, -1);
}

// 获取函数的名称
function getFuncName(fn) {
  const match = fn && fn.toString().match(/^\s*function (\w+)/);
  return match ? match[1] : '';
}

/**
 * 判断类型是否匹配
 * @param {*} value
 * @param {Function} type 构造函数
 * @returns Object
 */
function assertType(value, type) {
  let valid;
  const expectedType = getFuncName(type);
  if (simpleCheckRE.test(expectedType)) {
    const t = typeof value;
    valid = t === expectedType.toLowerCase();
    // 对于原始包装对象的判断, 例: new Number(0)
    if (!valid && t === 'object') {
      valid = value instanceof type;
    }
  } else if (expectedType === 'Object') {
    valid = getType(value) === 'Object'; // 是否普通对象
  } else if (expectedType === 'Array') {
    valid = Array.isArray(value);
  } else {
    valid = value instanceof type;
  }

  return {
    valid,
    expectedType,
  };
}
/**
 * assertType 的使用封装
 * @param {*} value 校验的值
 * @param {Function, Array} Type 类型
 * @param {Array} expectedTypes 接收预期类型的数组
 * @returns {Boolean} valid 校验结果
 */
function handleAssertType(value, type, expectedTypes) {
  let _valid;

  if (Array.isArray(type)) {
    _valid = type.some((t) => {
      const { expectedType, valid } = assertType(value, t);
      expectedTypes.push(expectedType || '');
      return valid;
    });
  } else {
    const { expectedType, valid } = assertType(value, type);
    expectedTypes.push(expectedType || '');
    _valid = valid;
  }

  return _valid;
}

/**
 * 根据 optionProps 校验选项集合里的属性值
 * @param {String} optKey 选项
 * @param {*} value 选项值
 * @param {String} track 轨迹
 * @returns {Boolean} valid
 */
function validateOptionAttr(optKey, value, track) {
  let valid = true;

  if (value === void 0) {
    return valid;
  }

  let validateInfo = optionProps[optKey];

  if (!validateInfo) {
    console.error(`异常`);
    return valid;
  }

  const { type, validValues } = validateInfo;

  // if (value !== null && type) {
  if (type) {
    const expectedTypes = [];
    if (!handleAssertType(value, type, expectedTypes)) {
      console.error(
        `${LOG_PREFIX}-${track || ''}: Invalid type for ${optKey}; type:"${getType(
          value
        )}"; Expected: ${expectedTypes.join(', ')}`
      );
      valid = false;
    }
  }

  if (validValues) {
    if (!validValues.includes(value)) {
      console.error(
        `${LOG_PREFIX}-${track || ''}: Invalid value for ${optKey}; value:"${value}"; Expected: ${validValues.join(
          ', '
        )}`
      );
      valid = false;
    }
  }

  return valid;
}

/**
 * 获取选项值, 如果没有值就取默认值
 * @param {String} optKey 选项key
 * @param {Object} options 选项集合
 * @returns {*} 选项值
 */
function getOptionValue(optKey, options) {
  let value;
  if (options != null) {
    value = options[optKey];
  }

  if (value === void 0) {
    let validateInfo = optionProps[optKey];
    if (validateInfo) {
      let defaultVal = validateInfo.default;
      if (defaultVal !== void 0) {
        if (typeof defaultVal === 'function') {
          value = validateInfo.default();
        } else {
          value = defaultVal;
        }
      }
    }
  }

  return value;
}

/**
 * 创建新的状态
 * @param {Object} inheritState 要继承的状态
 * @param {String} propKey 继承的属性
 * @returns {Object} 状态
 */
function createState(inheritState, propKey) {
  // if (!inheritState) {
  //   console.error(new Error(`参数异常`));
  // }
  const top = inheritState.top;
  const state = Object.create(top);
  state.modelTrack = []; // 模型的每一级的轨迹
  state.dataTrack = []; // 数据的每一级的轨迹
  state.propDataMap = null; // 有跨级的 propKey 的配置, 映射的data保存在这里
  state.logPrefix = LOG_PREFIX;

  const isTop = inheritState === top; // 父级是top
  if (isTop) {
    state.parent = null;
  } else {
    state.parent = inheritState;

    if (top.debugDescend && inheritState.getOwn('debugAlive')) {
      state.debugAlive = true;
    }

    let { modelTrack, dataTrack, propDataMap } = inheritState;

    if (modelTrack.length) {
      state.modelTrack.push(...modelTrack);
    }

    if (dataTrack.length) {
      state.dataTrack.push(...dataTrack);
    }

    if (propDataMap) {
      const propDataKeys = Object.keys(propDataMap);
      if (propDataKeys.length) {
        propDataKeys.forEach((key) => {
          const dataInfo = propDataMap[key];
          if (dataInfo.propArr[0] === propKey) {
            if (!state.propDataMap) {
              state.propDataMap = Object.create(null);
            }
            state.propDataMap[key] = dataInfo;
            // console.log(`${LOG_PREFIX}-State-inherit-propDataMap`, propKey, key, { ...state.propDataMap });
          }
        });
      }
    }
  }

  return state;
}

/**
 * 运行状态
 */
class RunState {
  /**
   * @param {Object} options 选项集合
   */
  constructor(options) {
    this.reverse = false; // model反向盖写data
    this.separator = '.'; // propKey的分隔符
    this.debugTarget = null; // 匹配调试
    this.debugDescend = false; // debug 匹配到之后, 子孙级是否生效
    this.debugBehind = false; // debug 匹配到之后, 后面的同级是否生效

    if (options) {
      optTopStateKeys.forEach((optKey) => {
        const optVal = getOptionValue(optKey, options);
        if (optVal !== void 0) {
          this[optKey] = optVal;
        }
      });
    }

    // 内部的运行参数
    this.debugAlive = false; // 是否激活断点, 不修改当前实例的
    this.hasDebugTarget = this.debugTarget != null; // 用于控制匹配
    this.top = this;
  }

  // 获取自身的属性
  getOwn(propKey) {
    if (Object.hasOwnProperty.call(this, propKey)) {
      return this[propKey];
    }
    return;
  }

  /**
   * 获取轨迹
   * @param {Boolean} isSource 数据源的视角
   * @returns {String} 轨迹字符串
   */
  getTrack(isSource) {
    const { reverse } = this;
    let isData = !!reverse;
    if (isSource) {
      isData = !isData;
    }
    if (isData) {
      return this.getDataTrack();
    }
    return this.getModelTrack();
  }
  // 获取model轨迹
  getModelTrack(addPath) {
    let tracks = this.modelTrack || [];
    if (addPath) {
      tracks = [...tracks, addPath];
    }
    return 'modelTrack:' + tracks.join(this.separator);
  }
  // 获取data轨迹
  getDataTrack(addPath) {
    let tracks = this.dataTrack || [];
    if (addPath) {
      tracks = [...tracks, addPath];
    }
    return 'dataTrack:' + tracks.join(this.separator);
  }

  /**
   * 控制打断点
   * @param {Object} target 匹配的目标
   * @param {Object} optDebugger 选项的 debugger 参数, 一起控制
   */
  handleDebugger(target, optDebugger) {
    if (!canDebugger) {
      return false;
    }
    if (this.debugAlive) {
      // 当前状态里已经记录匹配到
      return true;
    }
    if (this.debugBehind && this.parent && this.parent.debugAlive) {
      // 后面的同级生效的选项, 是通过修改父级激活状态实现的
      return true;
    }

    let alive = false;

    if (this.hasDebugTarget) {
      if (this.debugTarget === target) {
        alive = true;
        // this.top.hasDebugTarget = false; // 之后不再匹配

        this.debugAlive = alive;
        if (this.debugBehind && this.parent) {
          this.parent.debugAlive = alive;
        }
      }
    }

    if (optDebugger) {
      alive = true;

      if (this.debugDescend) {
        this.debugAlive = alive;
      }
      if (this.debugBehind && this.parent) {
        this.parent.debugAlive = alive;
      }
    }

    return alive;
  }
}

/**
 * 根据类型创建对象
 * @param {Function} createMethod 创建方法
 * @param {Object} packet 参数1方法的上下文
 * @returns 新对象
 */
function createObject(createMethod, packet) {
  if (createMethod) {
    // 自带创建方法, 没有使用和测试
    return createMethod.call(packet);
  }
  return {};
}

/**
 * 过滤参数 options
 * @param {Object} options
 * @param {Object} state
 */
function filterOptions(options, state) {
  if (options != null) {
    let optionsType = getType(options);
    if (optionsType !== 'Object') {
      let logPrefix = LOG_PREFIX;
      if (state) {
        logPrefix = state.logPrefix;
      }
      console.error(
        `${logPrefix}-${
          state ? state.getModelTrack() : ''
        }-Invalid type for options; type:"${optionsType}"; Expected: Object`
      );

      options = null;
    }
  }
  return options;
}

/**
 * 获取指定选项入参值, 可校验
 * @param {String} optKeys 选项key
 * @param {Object} options 选项集合
 * @param {Boolean} isValidate 是否校验
 * @param {Object} state 状态
 * @param {String} propKey 模型属性key
 * @returns {Object}
 */
function getValidateOpts(optKeys, options, isValidate, state, propKey) {
  const opts = {};

  if (options) {
    let track = '';
    if (isValidate && state) {
      track = state.getModelTrack(propKey);
    }

    optKeys.forEach((optKey) => {
      const optVal = options[optKey];
      if (optVal !== void 0) {
        if (isValidate) {
          validateOptionAttr(optKey, optVal, track);
        }
        opts[optKey] = optVal;
      }
    });
  }

  return opts;
}

/**
 * 获取指定选项的值或默认值
 * @param {String} optKeys 选项key
 * @param {Object} options 选项集合
 * @param {Object} state 状态
 * @returns {Object}
 */
function getFinalOpts(optKeys, options, state) {
  const opts = {};

  optKeys.forEach((optKey) => {
    const optVal = getOptionValue(optKey, options);
    if (optVal !== void 0) {
      opts[optKey] = optVal;
    }
  });

  return opts;
}

/**
 * 获取属性使用的选项
 * @param {Object} state 状态
 * @param {Object} propOpts 属性的选项
 * @param {Boolean} isValidate 是否校验
 * @param {String} propKey 模型属性key
 * @returns 处理过的属性选项
 */
function getPropOptions(state, propOpts, isValidate, propKey) {
  const propOptsType = getType(propOpts);
  if (!(propOptsType === 'Object' || propOpts == null)) {
    if (propOptsType === 'Boolean') {
      propOpts = { isModel: propOpts };
    } else if (propOptsType === 'String' || propOptsType === 'Array') {
      propOpts = { path: propOpts };
    } else {
      console.error(new Error(`${state.logPrefix}-propOpts-格式错误`));
      propOpts = null;
    }
  }

  // 取值和校验
  const opts = getValidateOpts(optPropUsableKeys, propOpts, isValidate, state, propKey);

  // config 做个浅拷贝, 方便后面修改内容
  if (getType(opts.config) === 'Object') {
    opts.config = { ...opts.config };
  }

  // path处理
  let dataPaths = opts.path;
  if (dataPaths != null) {
    if (typeof dataPaths === 'string') {
      if (dataPaths === '') {
        dataPaths = null;
      } else {
        dataPaths = dataPaths.split(state.separator);
      }
    } else if (Array.isArray(dataPaths)) {
      dataPaths = [...dataPaths];
    } else {
      dataPaths = null;
    }
    opts.path = dataPaths;
  }

  // console.log('get_PropOptions', opts);
  return opts;
}

/**
 * 根据参数获取对象的 keys
 * @param {Object} obj 普通对象
 * @param {Array} include 包含 key 的集合
 * @param {Array} exclude 不包含 key 的集合
 * @returns {Array} keys
 */
function getObjectKeys(obj, include, exclude) {
  let keyList;

  if (include) {
    if (Array.isArray(include)) {
      keyList = [];
      include.forEach((propKey, index) => {
        const propKeyType = typeof propKey;
        if (!(propKeyType === 'string' || propKeyType === 'number')) {
          console.error(`${LOG_PREFIX}-格式错误: "include[${index}]"值应该是字符串或者数字`, propKeyType, propKey);
        }
        keyList.push(propKey + '');
      });
    } else {
      console.error(`${LOG_PREFIX}-格式错误: "include"期望值是数组，已做无效处理`, getType(include), include);
    }
  }

  if (!keyList) {
    keyList = Object.keys(obj);
  }

  if (Array.isArray(exclude) && exclude.length) {
    keyList = keyList.filter(
      (propKey) =>
        !exclude.some((eVal) => {
          if (typeof eVal === 'function') {
            // console.log(`${LOG_PREFIX}-exclude-function`, propKey, eVal(propKey));
            return !!eVal(propKey);
          }
          return propKey === eVal;
        })
    );
  }

  return keyList;
}

/**
 * 打包 propPath 对应的配置项
 */
function packConfigItem(propPath, propArr, options) {
  return { propPath, propArr, options };
}

/**
 * 运行的盖写表单数据的函数
 * @param {Object} state 运行时的状态
 * @param {Object} model 表单模型
 * @param {Object} data 数据
 * @param {Object} options 拓展选项, 详见: optionProps
 */
function assignMethod(state, model, data, options) {
  state.logPrefix += '/fn';

  // 运行中修改 options 的方法, 可修改当前要获取的 options
  if (options.modifyOptions) {
    // 要考虑 partState 内的参数被修改的可能
    const partState = {
      reverse: state.reverse,
    };
    options = options.modifyOptions(options, partState);
    if (options === void 0) {
      console.warn(`${state.logPrefix}-${state.getModelTrack()}-选项“modifyOptions”需要返回值`);
    }
    options = filterOptions(options);
    options = getValidateOpts(optModelUsableKeys, options, true, state);
  }

  // 层级选项
  const tierOpts = getFinalOpts(optTierKeys, options, state);
  // 模型专属选项
  const modelOpts = getFinalOpts(optModelKeys, options, state);

  // 是否调试打印
  const isDebugLog = !!tierOpts.debugLog;

  // 需要处理的属性集合
  const propList = getObjectKeys(model, modelOpts.include, modelOpts.exclude);

  if (isDebugLog) {
    console.log(`${state.logPrefix}-assign_Method-${state.getModelTrack()}`, state);
  }
  if (state.handleDebugger(model, tierOpts.debugger)) {
    debugger;
  }

  if (!propList.length) {
    if (isDebugLog) {
      console.log(`${state.logPrefix}-模型（${state.getModelTrack()}）没有可执行的属性`); // prettier-ignore
    }
    return;
  }

  // 拓展propList的信息
  const propInfoList = propList.map((propKey) => ({ propKey, configList: [], order: 0 }));

  // 将 config 的数据分配到 propInfoList 里
  const config = options.config;
  if (config) {
    const { separator } = state;
    Object.keys(config).forEach((propPath) => {
      const propArr = propPath.split(separator);
      const rootPropKey = propArr[0];

      propInfoList.some((propInfo) => {
        if (propInfo.propKey === rootPropKey) {
          propInfo.configList.push(packConfigItem(propPath, propArr, config[propPath]));
          return true;
        }
        return false;
      });
    });
  }

  propInfoList.forEach((item) => {
    const configList = item.configList;

    if (!configList.length) {
      // item.order = 0;
      return;
    }

    const propKey = item.propKey;

    // 排序，路径分段少的在前, 方便后面的处理
    configList.sort((a, b) => a.propArr.length - b.propArr.length);

    configList.forEach((configItem) => {
      configItem.options = getPropOptions(state, configItem.options, configItem.propPath === propKey, propKey);
    });

    const propOptWrap = configList[0];

    // 把序号写在外面
    item.order = +propOptWrap.options.order || 0;
  });

  // 排序order, 数值越小, 排列越靠前, 默认为0
  propInfoList.sort((a, b) => a.order - b.order);
  if (isDebugLog) {
    let isSortChange = false;
    let sortLog = propInfoList.map((o, i) => {
      let focal = '';
      // 比较顺序是否改变
      if (o.propKey !== propList[i]) {
        isSortChange = true;
        focal = `${propList[i]} ==> `;
      }
      return `${focal}${o.propKey} (${o.order})`;
    });
    if (isSortChange) {
      console.log(`${state.logPrefix}-排序变化-propList`, sortLog);
    }
  }

  // 继承的选项
  const inheritOpts = getFinalOpts(optInheritableKeys, options, state);

  // 运行
  propInfoList.forEach(({ propKey, configList }) => {
    const propState = createState(state, propKey);

    propState.logPrefix += '/prop';
    propState.modelTrack.push(propKey);

    if (propState.handleDebugger(model[propKey], tierOpts.debugger)) {
      debugger;
    }

    let _data = data;
    const { propDataMap } = propState;

    // 更新属性对应的 data
    if (propDataMap && propDataMap[propKey]) {
      _data = propDataMap[propKey].data;

      if (!configList.length) {
        console.warn(`${propState.logPrefix}-${propState.getModelTrack()}-无配置更新data-propDataMap:`, {
          ...propDataMap,
        });
      }

      delete propDataMap[propKey];
      // propState.dataTrack.push(trackRedirectSign);
      propState.dataTrack = [trackRedirectSign]; // 重置路径

      if (isDebugLog) {
        console.log(`${propState.logPrefix}-${propState.getModelTrack()}-更新 state 里的 data:`, _data, [
          ...configList,
        ]);
      }
    }

    if (!data) {
      console.error(`${propState.logPrefix}-${propState.getDataTrack()}/${propKey}: 无data`);
      return;
    }

    // 根据是否有属性的配置来分配处理方法
    if (configList.length) {
      handleHasConfig(propState, model, _data, propKey, configList, inheritOpts, tierOpts);
    } else {
      handleNotConfig(propState, model, _data, propKey, inheritOpts, tierOpts);
    }
  });
}

// 判断属性对应的值是否是模型
function isPropModel(value, options = {}) {
  if (options.judgeModel !== 'none') {
    // if (options.isModel === void 0) {
    if (options.isModel == null) {
      return getType(value) === 'Object';
    }
  }
  return !!options.isModel;
}

// 没有有效配置时的处理方法
function handleNotConfig(state, model, data, propKey, inheritOpts, tierOpts) {
  state.logPrefix += '/NCg';

  if (tierOpts.debugLog) {
    console.log(`${state.logPrefix}-${state.getModelTrack()}`, propKey);
  }

  const modelVal = model[propKey];
  // 属性值是否是模型
  const isModel = isPropModel(modelVal, inheritOpts);

  state.dataTrack.push(propKey);

  if (state.handleDebugger(model, tierOpts.debugger)) {
    debugger;
  }

  if (isModel) {
    if (state.reverse) {
      // model生成data时主动创建没有的中间对象
      if (data[propKey] == null) {
        data[propKey] = createObject();
      } else if (typeof data[propKey] !== 'object') {
        data[propKey] = createObject();
        console.warn(`${state.logPrefix}-data属性不是对象-修改-${state.getDataTrack()}`, tierOpts.debugLog ? data : '');
      }
    } else {
      if (!Object.hasOwnProperty.call(data, propKey)) {
        if (tierOpts.debugLog) {
          console.log(`${state.logPrefix}-取值中断-无值-${state.getDataTrack()}`, data);
        }
        return;
      } else if (data[propKey] == null) {
        if (tierOpts.debugLog) {
          console.log(`${state.logPrefix}-取值中断-null-${state.getDataTrack()}`, data);
        }
        return;
      } else if (typeof data[propKey] !== 'object') {
        console.warn(`${state.logPrefix}-取值中断-格式错误-${state.getDataTrack()}`, tierOpts.debugLog ? data : '');
        return;
      }
    }

    assignMethod(state, modelVal, data[propKey], inheritOpts);
  } else {
    overwriteSet(state, model, propKey, data, propKey, inheritOpts, tierOpts);
  }
}

// 有配置的处理方法
function handleHasConfig(state, model, data, propKey, configList, inheritOpts, tierOpts) {
  state.logPrefix += '/HCg';

  // 通过前面的处理, 第一个肯定会是当前propKey的配置
  const propOptWrap = configList.shift();

  let options = propOptWrap.options;

  // 属性的选项继承 inheritOpts 的选项
  Object.keys(inheritOpts).forEach((key) => {
    if (options[key] === void 0) {
      options[key] = inheritOpts[key];
    }
  });

  // 获取属性可用的选项, 补充默认值
  options = getFinalOpts(optPropUsableKeys, options, state);

  const modelVal = model[propKey];
  // 属性值是否是模型
  const isModel = isPropModel(modelVal, options);

  tierOpts = { ...tierOpts };
  if (options.debugLog) {
    tierOpts.debugLog = options.debugLog;
  }
  if (options.debugger) {
    tierOpts.debugger = options.debugger;
  }
  // 添加打印标记
  tierOpts.modelSign = isModel ? 'model' : 'val';

  if (tierOpts.debugLog) {
    console.log(`${state.logPrefix}-${tierOpts.modelSign}-${state.getModelTrack()}`);
  }

  // data的属性路径
  let dataPaths = options.path || propOptWrap.propArr;

  if (state.handleDebugger(model, tierOpts.debugger)) {
    debugger;
  }

  if (isModel) {
    // 其他更深的路径合入当前propKey配置, 要在 handleDataPath 之前
    if (configList.length) {
      if (!options.config) {
        options.config = {};
      }
      const propConfig = options.config;
      //
      if (!state.propDataMap) {
        state.propDataMap = {};
      }
      const propDataMap = state.propDataMap;
      //
      configList.forEach((configItem) => {
        const configPropArr = configItem.propArr;
        const configPropPath = configItem.propPath;
        if (!(configPropArr.length > 1)) {
          console.warn(`${state.logPrefix}-异常`, configItem);
          return;
        }

        // 再下一级模型配置的属性字段
        const branchPropArr = configPropArr.slice(1);
        const branchPropPath = branchPropArr.join(state.separator);
        const branchPropOptions = (propConfig[branchPropPath] = getPropOptions(
          state,
          propConfig[branchPropPath],
          false
        ));

        // 数据选项 path 降级或者添加到 propDataMap
        const configItemOptions = configItem.options;
        const configDataPath = configItemOptions.path;
        if (configDataPath) {
          if (configDataPath[0] === configPropArr[0]) {
            configItemOptions.path = configDataPath.slice(1);

            if (tierOpts.debugLog) {
              console.log(
                `${state.logPrefix}-configDataPath ${state.getModelTrack()}/${branchPropPath}:`,
                configDataPath,
                configPropArr,
                branchPropOptions
              );
            }
          } else {
            // propDataMap 添加数据在这里
            propDataMap[branchPropPath] = {
              data: data, // 这里或许可以支持其他来源的data
              propArr: branchPropArr,
              dataPath: configDataPath,
            };

            if (tierOpts.debugLog) {
              console.log(`${state.logPrefix}-propDataMap 添加 ${state.getModelTrack()}/${branchPropPath}:`, {
                configPropPath,
                branchPropOptions,
                ...propDataMap[branchPropPath],
              });
            }
          }
        }
        // 合并入下一级属性对应的 options 这里会覆盖
        Object.assign(branchPropOptions, configItemOptions);

        // 更新 propDataMap
        if (propDataMap[configPropPath]) {
          let branchData = propDataMap[configPropPath];
          if (propDataMap[branchPropPath]) {
            if (tierOpts.debugLog) {
              console.log(
                `${state.logPrefix}-dataPath覆盖 ${state.getModelTrack()}/${branchPropPath}:`,
                propDataMap[branchPropPath],
                branchData
              );
            }
          }
          branchData.propArr = branchPropArr;
          propDataMap[branchPropPath] = branchData;
          delete propDataMap[configPropPath];

          if (tierOpts.debugLog) {
            console.log(`${state.logPrefix}-propDataMap 降级 ${state.getModelTrack()}/${branchPropPath}:`, {
              configPropPath,
              branchPropOptions,
              ...propDataMap[branchPropPath],
            });
          }
        }
      });

      if (state.handleDebugger(model, tierOpts.debugger)) {
        debugger;
      }
    }

    // 没有 dataPaths 是允许的, data 不更新
    if (!dataPaths.length) {
      if (tierOpts.debugLog) {
        console.log(`${state.logPrefix}-${tierOpts.modelSign}-${state.getDataTrack()}: data 没有取值路径`, options);
      }

      return assignMethod(state, modelVal, data, options);
    }

    const packet = handleDataPath(state, isModel, data, dataPaths, options, tierOpts);
    if (packet.valid) {
      assignMethod(state, modelVal, packet.data, options);
    }
    return;
  }

  if (configList.length) {
    console.warn(
      `${state.logPrefix}-${tierOpts.modelSign}-${state.getDataTrack()}: 无效配置, 所属父级不是model`,
      configList.map((item) => item.propPath)
    );
  }

  if (!dataPaths.length) {
    console.error(`${state.logPrefix}-${tierOpts.modelSign}-${state.getDataTrack()}: !dataPaths.length`);
    return;
  }

  const packet = handleDataPath(state, isModel, data, dataPaths, options, tierOpts);
  if (packet.valid) {
    overwriteSet(state, model, propKey, packet.data, packet.tierKey, options, tierOpts);
  }
}

/**
 * 处理data的路径, 获取新data和对应的属性key
 * @param {Object} state 状态
 * @param {Boolean} isModel 属性是否是模型
 * @param {Object} data 数据
 * @param {Array} dataPaths 数据的取值路径
 * @param {Object} options 选项集合
 * @param {Object} tierOpts 层选项集合
 * @returns {Object} 处理结果的数据包
 */
function handleDataPath(state, isModel, data, dataPaths, options, tierOpts) {
  state.logPrefix += '/DP';
  const { reverse } = state;
  // 创建处理结果的数据包
  const packet = {
    data,
    tierKey: null, // 当前层的 dataPropKey
    valid: true, // 结果是否有效
  };

  dataPaths.every(({ tierPath, index }) => {
    if (typeof tierPath === 'number') {
      tierPath += '';
    }
    if (typeof tierPath !== 'string') {
      console.error(
        new Error(`${state.logPrefix}-${tierOpts.modelSign}-${state.getDataTrack()}-dataPropKey无效-${tierPath}`)
      );
      return false;
    }

    packet.tierKey = tierPath;

    state.dataTrack.push(tierPath);

    if (isModel || index < dataPaths.length - 1) {
      const backupData = packet.data;
      packet.data = backupData[tierPath];

      if (reverse) {
        packet.valid = handleReverseTierDataPath(state, packet, backupData, options, tierOpts);
      } else {
        packet.valid = handleTierDataPath(state, packet, backupData, options, tierOpts);
      }
    }

    return packet.valid;
  });

  return packet;
}
// 处理反向时的一层data的路径
function handleReverseTierDataPath(state, packet, backupData, options, tierOpts) {
  let isCreateObject = false;

  if (packet.data == null) {
    // model 生成 data 时, 自动创建没有的中间对象
    isCreateObject = true;
  } else if (typeof packet.data !== 'object') {
    // data 不是对象时, 暂定为修改并提示
    isCreateObject = true;

    console.warn(`${state.logPrefix}-${tierOpts.modelSign}-${state.getDataTrack()}-data不是对象-修改`);
  }

  if (isCreateObject) {
    packet.data = backupData[packet.tierKey] = createObject(options.createData, { ...packet });
  }

  return true;
}
// 处理一层data的路径
function handleTierDataPath(state, packet, backupData, options, tierOpts) {
  if (!Object.hasOwnProperty.call(backupData, packet.tierKey)) {
    // 不拦截空data的选项
    if (options.noInterceptEmptyData) {
      if (tierOpts.debugLog) {
        console.log(
          `${state.logPrefix}-${tierOpts.modelSign}-取值-无data-noInterceptEmptyData-${state.getDataTrack()}`,
          backupData
        );
      }
      packet.data = emptyObject;
      return true;
    }

    // 子属性的选项里能获取到data
    if (state.propDataMap && Object.keys(state.propDataMap).length) {
      if (tierOpts.debugLog) {
        console.log(
          `${state.logPrefix}-${tierOpts.modelSign}-取值-无data-propDataMap-${state.getDataTrack()}`,
          backupData,
          state.propDataMap
        );
      }
      packet.data = emptyObject;
      return true;
    }

    if (tierOpts.debugLog) {
      console.log(`${state.logPrefix}-${tierOpts.modelSign}-取值中断-无data-${state.getDataTrack()}`, backupData);
    }
    return false;
  }

  if (packet.data == null) {
    // 不拦截空data的选项
    if (options.noInterceptEmptyData) {
      if (tierOpts.debugLog) {
        console.log(
          `${state.logPrefix}-${tierOpts.modelSign}-取值-null-noInterceptEmptyData-${state.getDataTrack()}`,
          backupData
        );
      }
      packet.data = emptyObject;
      return true;
    }

    // 子属性的选项里能获取到data
    if (state.propDataMap && Object.keys(state.propDataMap).length) {
      // 子属性带有data
      if (tierOpts.debugLog) {
        console.log(
          `${state.logPrefix}-${tierOpts.modelSign}-取值-null-propDataMap-${state.getDataTrack()}`,
          backupData,
          state.propDataMap
        );
      }
      packet.data = emptyObject;
      return true;
    }

    if (tierOpts.debugLog) {
      console.log(`${state.logPrefix}-${tierOpts.modelSign}-取值中断-null-${state.getDataTrack()}`, backupData);
    }
    return false;
  }

  if (typeof packet.data !== 'object') {
    console.warn(`${state.logPrefix}-${tierOpts.modelSign}-取值中断-格式异常-${state.getDataTrack()}`, backupData);
    return false;
  }

  return true;
}

/**
 * 写数据方法 overwrite
 * @param {Object} arguments[0] state 运行状态
 * @param {Object} arguments[1] objectModel 模型对象
 * @param {String} arguments[2] modelPropKey 模型的propKey
 * @param {Object} arguments[3] objectData 数据对象
 * @param {String} arguments[4] dataPropKey 数据的propKey
 * @param {Object} arguments[5] options 选项, 详见: optionProps
 * @param {Object} arguments[5] tierOpts 当前层选项
 */
function overwriteSet() {
  // console.log('overwriteSet', this, ...arguments);
  const state = arguments[0];
  const reverse = state.reverse;
  const objectTarget = reverse ? arguments[3] : arguments[1], // 盖写的目标对象
    targetPropKey = reverse ? arguments[4] : arguments[2], // 盖写的目标propKey
    objectSource = reverse ? arguments[1] : arguments[3], // 数据的来源对象
    sourcePropKey = reverse ? arguments[2] : arguments[4]; // 数据的来源propKey
  const options = arguments[5] || {};
  const tierOpts = arguments[6] || {};

  state.logPrefix += '/set';

  if (tierOpts.debugLog) {
    console.log(`${state.logPrefix}-${state.getTrack()}-overwrite_Set`);
  }
  if (state.handleDebugger(arguments[1], tierOpts.debugger)) {
    debugger;
  }

  if (!reverse) {
    // 数据写入模型时判断 objectSource 里是否有 sourcePropKey, ignoreOwnProperty可跳过
    if (!options.ignoreOwnProperty && !Object.hasOwnProperty.call(objectSource, sourcePropKey)) {
      if (options.required) {
        console.error(`${state.logPrefix}-required: 数据来源缺少属性"${state.getDataTrack()}"`);
      }
      return;
    }
  }

  let value = objectSource[sourcePropKey];
  const methodOpts = {
    reverse,
    params: options.params,
    assignModel,
    target: objectTarget,
    targetProp: targetPropKey,
    source: objectSource,
    sourceProp: sourcePropKey,
  };

  // 是否不做"类型匹配"验证, 有其他验证后也不再做
  let noTypeMatch = !!options.noTypeMatch;

  // 拦截器, 赋值前的拦截
  if (options.interceptor) {
    if (options.interceptor(value, methodOpts)) {
      // 这里暂时定为普通log提示, 如需其他类型的提示, 建议放在 interceptor 内部
      if (tierOpts.debugLog) {
        console.log(`${state.logPrefix}-interceptor: "${state.getModelTrack()}"`);
      }
      return;
    }
    noTypeMatch = true;
  }

  // 修改值的方法, 暂定在类型判断前执行
  if (options.replace) {
    value = options.replace(value, methodOpts);
    noTypeMatch = true;
  }

  // 不能是空值
  if (options.required && value === void 0) {
    console.error(new Error(`${state.logPrefix}-required: 属性"${state.getTrack()}"不能赋予空值`));

    if (options.interceptInvalid) {
      if (tierOpts.debugLog) {
        console.log(`${state.logPrefix}-interceptInvalid-required`, state.getModelTrack());
      }
      return;
    }
    noTypeMatch = true;
  }

  // 判断类型
  let createType = options.type;
  if (createType && value !== void 0) {
    const expectedTypes = [];
    if (!handleAssertType(value, createType, expectedTypes)) {
      console.error(
        `${state.logPrefix}-Invalid type for ${state.getTrack(true)}; type:"${getType(
          value
        )}"; Expected ${expectedTypes.join(', ')}`
      );

      if (options.interceptInvalid) {
        if (tierOpts.debugLog) {
          console.log(`${state.logPrefix}-interceptInvalid-type`, state.getModelTrack());
        }
        return;
      }
    }
    noTypeMatch = true;
  }

  // 验证方法
  let validator = options.validator;
  if (validator) {
    let valid = validator(value, methodOpts);
    if (typeof valid !== 'boolean') {
      console.error(`${state.logPrefix}-validator 的返回值应该是 boolean 类型`);
    }
    if (valid === false) {
      console.error(`${state.logPrefix}-validator-Invalid value for "${state.getTrack(true)}";`);

      if (options.interceptInvalid) {
        if (tierOpts.debugLog) {
          console.log(`${state.logPrefix}-interceptInvalid-validator`, state.getModelTrack());
        }
        return;
      }
    }
    noTypeMatch = true;
  }

  // "类型匹配", 新旧值类型对比验证; 这里的逻辑是根据表单特征写的, 非必须, 可根据使用场景修改
  if (!noTypeMatch) {
    // 修改前指的类型, 是空值就不用比较类型
    let oldType = getType(objectTarget[targetPropKey]);
    if (!(oldType === 'Null' || oldType === 'Undefined')) {
      // 新指的类型, 是空值也不用比较类型
      let valType = getType(value);
      if (!(valType === 'Null' || valType === 'Undefined')) {
        // 按表单特性拦截不匹配的值, 这里只是简单通用的拦截规则
        if (oldType !== valType) {
          if ((oldType === 'String' && valType === 'Number') || (oldType === 'Number' && valType === 'String')) {
            // 字符串和数字的转换这里没有拦截
            if (tierOpts.debugLog) {
              console.log(`${state.logPrefix}-值类型变化-${state.getTrack()}`, `${oldType} to ${valType}`);
            }
          } else {
            console.warn(`${state.logPrefix}-新旧值类型不匹配-${state.getTrack()}`, oldType, valType);

            if (options.interceptInvalid) {
              if (tierOpts.debugLog) {
                console.log(`${state.logPrefix}-interceptInvalid-match`, state.getModelTrack());
              }
              return;
            }
          }
        }
      }
    }
  }

  // if (tierOpts.debugLog) {
  //   console.log(`${state.logPrefix}-赋值`, state.getModelTrack(), state.getDataTrack()); // prettier-ignore
  // }

  if (options.lastSet) {
    options.lastSet(objectTarget, targetPropKey, value, methodOpts);
  } else {
    objectTarget[targetPropKey] = value;
  }
}

export default assignModel;
