/**
 * 基础工具
 */
//
// import $env from '@/common/$env';
// import { HTML_TAGS, SVG_TAGS, VOID_TAGS } from '@/common/$constants';
import $regexps from '@/common/$regexps';
import { isArray, isObject } from '@/common/$types';
// methods

/**
 * 生成全局唯一的id
 * @returns {Number}
 */
export const generGuid = (function () {
  let guid = 0;
  return function () {
    return ++guid;
  };
})();

function makeMap(str, expectsLowerCase) {
  const map = Object.create(null);
  const list = str.split(',');
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return expectsLowerCase ? (val) => !!map[val.toLowerCase()] : (val) => !!map[val];
}

// const isHTMLTag = makeMap(HTML_TAGS);
// const isSVGTag = makeMap(SVG_TAGS);
// const isVoidTag = makeMap(VOID_TAGS);

const hasOwnProperty$1 = Object.prototype.hasOwnProperty;
export const hasOwn = (val, key) => hasOwnProperty$1.call(val, key);

// 获取函数的名称
export function getFuncName(ctor) {
  const match = ctor && ctor.toString().match(/^\s*(function|class) (\w+)/);
  return match ? match[2] : ctor === null ? 'null' : '';
}

const isSimpleType = makeMap('String,Number,Boolean,Function,Symbol,BigInt');
function assertType(value, type) {
  let valid;
  const expectedType = getFuncName(type);
  if (isSimpleType(expectedType)) {
    const t = typeof value;
    valid = t === expectedType.toLowerCase();
    if (!valid && t === 'object') {
      valid = value instanceof type;
    }
  } else if (expectedType === 'Object') {
    valid = isObject(value);
  } else if (expectedType === 'Array') {
    valid = isArray(value);
  } else if (expectedType === 'null') {
    valid = value === null;
  } else {
    valid = value instanceof type;
  }
  return {
    valid,
    expectedType,
  };
}

/**
 * 比较两个版本号的方法
 * @param {String} v1 版本号1
 * @param {String} v2 版本号2
 * @returns {Number} { 0: 相等, 1: v1 > v2, -1: v1 < v2 }
 */
export function compareVersion(v1, v2) {
  // 将两个版本号拆成数组
  const separator = '.'; // 分隔符
  let arr1 = v1.split(separator),
    arr2 = v2.split(separator);
  let maxLength = Math.max(arr1.length, arr2.length);
  // 依次比较版本号每一位大小
  for (let i = 0; i < maxLength; i++) {
    const num1 = parseInt(arr1[i] || 0);
    const num2 = parseInt(arr2[i] || 0);
    if (num1 > num2) {
      return 1;
    } else if (num1 < num2) {
      return -1;
    }
  }
  return 0;
}

/**
 * 检测 localStorage,sessionStorage 等是否受支持和可用
 * @param {String} type localStorage 或 sessionStorage
 */
export function storageAvailable(type) {
  let storage;
  try {
    storage = window[type];
    let x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (error) {
    return (
      error instanceof DOMException &&
      //除了Firefox
      (error.eode === 22 ||
        // Firefox
        error.cede === 1014 ||
        // test name field too,because code might not be present
        // everything except Firefox
        error.name == 'QuotaExceededError' ||
        // Firefox
        error.name == 'NS_ERROR_DOM_QUOTA_REACHED') &&
      // acknowledge QuotaExceededError only if there's something already stored
      storage &&
      storage.length !== 0
    );
  }
}

/**
 * 判断是否是空值
 * @param {*} val	要判断的值
 * @returns {boolean} 是空值则为true
 */
export function isEmpty(val) {
  if (val == null) return true;
  if (typeof val === 'number') {
    // if (isNaN(val)) return true; // NaN不应该在这个方法里做判断
    // if (val === 0) return true; // 如果0是空值
    return false;
  }
  if (typeof val === 'boolean') return false;
  if (typeof val === 'string') return !val.trim();
  if (val instanceof Error) return val.message === '';
  switch (Object.prototype.toString.call(val)) {
    case '[object Array]': {
      return !val.length;
    }
    case '[object Object]': {
      return !Object.keys(val).length; // 只判断对象自身可枚举的属性
    }
    case '[object File]':
    case '[object Map]':
    case '[object Set]': {
      return !val.size;
    }
  }
  return false;
}

/**
 * 各种数据转换成文本字符串
 * @param {*} data 数据
 * @returns {String} 文本字符串
 */
export function formatToText(data) {
  let val = '';
  if (data == null) return val;
  if (typeof data === 'object') {
    try {
      val = JSON.stringify(data); // TODO还有各种对象的细分处理
    } catch (error) {
      console.error(error);
      val = '' + val.toString();
    }
  } else {
    val = String(val);
  }
  return val;
}

/**
 * 时间格式转换
 * @param { Date, Number } date
 * @param { String } fmt 时间的输出格式
 * @returns 输出格式化的时间
 */
export function formatDate(date, fmt) {
  if (date == null) {
    return '';
  }
  switch (typeof date) {
    case 'string':
      return date;
    case 'number':
      date = new Date(date);
      break;
    case 'object':
      break;
    default:
      return date;
  }
  if (!fmt) {
    fmt = 'yyyy-MM-dd HH:mm:ss';
  }
  const o = {
    'M+': date.getMonth() + 1, // 月份
    'd+': date.getDate(), // 日
    'h+': date.getHours(), // 小时, TODO
    'H+': date.getHours(), // 小时, 24小时
    'm+': date.getMinutes(), // 分
    's+': date.getSeconds(), // 秒
    'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
    'S+': date.getMilliseconds(), // 毫秒
  };
  // console.log('fmt',fmt);
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  for (let k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length));
    }
  }
  return fmt;
}

/**
 * 转千分位
 */
export function formatThousands(val) {
  let type = typeof val;
  if (type === 'number') {
    val += '';
  } else if (type !== 'string') {
    return val;
  }
  return val.replace($regexps.parseThousands, (v) => v + ',');
}

/**
 * 对象转URL参数
 * @param {Object} paramObj
 * @param {Object, Boolean} opt
 * @returns {String} URL参数
 */
export function formatObjToUrlParam(paramObj, opt) {
  if (Object.prototype.toString.call(opt) !== '[object Object]') {
    if (opt === true) {
      opt = { encode: true };
    } else {
      opt = {};
    }
  }
  let paramStr = '';
  if (Object.prototype.toString.call(paramObj) !== '[object Object]') {
    console.error('objToUrlParam: 参数格式错误');
    return paramStr;
  }
  let arr = [];
  Object.entries(paramObj).forEach((key, val) => {
    if (val == undefined) return;
    val = String(val);
    if (opt.encode === true) {
      val = opt.encodeURIComponent(val);
    } else if (typeof opt.encode === 'function') {
      val = opt.encode(val);
    }
    if (opt.encodeKey === true) {
      key = encodeURIComponent(key);
    } else if (typeof opt.encodeKey === 'function') {
      key = opt.encodeKey(key);
    }
    arr.push(key + '=' + val);
  });
  paramStr = arr.join('&');
  return paramStr;
}

/**
 * 取小数部分
 * 如果是NaN就返回NaN
 * @param {Number,String} value
 * @returns {String} 小数部分的
 */
export const formatDecimalPart = function (value) {
  if (isNaN(value)) return NaN;
  let valStr = String(value);
  valStr = valStr.split('.')[1] || '0';
  return valStr;
};

/**
 * 获取 origin 当window.location里没有origin时
 * @returns {String} origin
 */
export function getOrigin() {
  let location = window.location;
  let origin = '';
  if (location.origin) {
    origin = location.origin;
  } else {
    origin = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
  }
  return origin;
}

/**
 * 去除空格等
 */
// export function formatTrim(str) {
//   str += '';
//   return str
//     .replace(/^\s\s*/, '')
//     .replace(/\s\s*$/, '')
//     .replace(/^\u00A0\u00A0*/, '')
//     .replace(/\u00A0\u00A0*$/, '')
//     .replace(/^\u3000\u3000*/, '')
//     .replace(/\u3000\u3000*$/, '');
// }

/**
 * 过滤xss字符串：% < > [ ] { } ; & - " ( )
 * @param {String} str
 * @returns {String}
 */
export function filterXSS(str) {
  str += '';
  return str.replace(/[%<>\[\]\{\};&\-\\"\(\)]/g, '');
}

/**
 * 颜色RGB转HSL
 * @param {Number} R [0,255]
 * @param {Number} G [0,255]
 * @param {Number} B [0,255]
 * @returns {Array} ([H,S,L]) 转hsl的结果
 */
export function rgb2hsl(R, G, B) {
  const _R = R / 255 || 0;
  const _G = G / 255 || 0;
  const _B = B / 255 || 0;
  const Cmax = Math.max(_R, _G, _B);
  const Cmin = Math.min(_R, _G, _B);
  const V = Cmax - Cmin;
  let H = 0;
  if (V === 0) {
    H = 0;
  } else if (Cmax === _R) {
    H = 60 * (((_G - _B) / V) % 6);
  } else if (Cmax === _G) {
    H = 60 * ((_B - _R) / V + 2);
  } else if (Cmax === _B) {
    H = 60 * ((R - _G) / V + 4);
  }
  H = Math.floor(backCycle(H, 360));
  const L = numberFixed((Cmax + Cmin) / 2);
  const S = V === 0 ? 0 : numberFixed(V / (1 - Math.abs(2 * L - 1)));

  function backCycle(num, cycle) {
    let index = num % cycle;
    if (index < 0) {
      index += cycle;
    }
    return index;
  }
  function numberFixed(num = 0, count = 3) {
    const power = Math.pow(10, count);
    return Math.floor(num * power) / power;
  }

  return [H, S, L];
}

/**
 * 颜色HSL转RGB
 * @param {Number} H 色相 [0,360]
 * @param {Number} S 饱和度 [0,1]
 * @param {Number} L 亮度 [0,1]
 * @returns {Array} ([R, G, B]) 转rgb的结果
 */
export function hsl2rgb(H, S, L) {
  H = +H || 0;
  S = +S || 0;
  L = +L || 0;
  const C = (1 - Math.abs(2 * L - 1)) * S;
  const X = C * (1 - Math.abs(((H / 60) % 2) - 1));
  const m = L - C / 2;
  const vRGB = [];
  if (H >= 0 && H < 60) {
    vRGB.push(C, X, 0);
  } else if (H >= 60 && H < 120) {
    vRGB.push(X, C, 0);
  } else if (H >= 120 && H < 180) {
    vRGB.push(0, C, X);
  } else if (H >= 180 && H < 240) {
    vRGB.push(0, X, C);
  } else if (H >= 240 && H < 300) {
    vRGB.push(X, 0, C);
  } else if (H >= 300 && H < 360) {
    vRGB.push(C, 0, X);
  }
  const [vR, vG, vB] = vRGB;
  const R = 255 * [vR + m];
  const G = 255 * [vG + m];
  const B = 255 * [vB + m];

  return [R, G, B];
}
