const objectToString = Object.prototype.toString;

export const toTypeString = (value) => objectToString.call(value);

export const isArray = Array.isArray;

export const isMap = (val) => toTypeString(val) === '[object Map]';

export const isSet = (val) => toTypeString(val) === '[object Set]';

export const isDate = (val) => toTypeString(val) === '[object Date]';

export const isRegExp = (val) => toTypeString(val) === '[object RegExp]';

export const isFunction = (val) => typeof val === 'function';

export const isString = (val) => typeof val === 'string';

export const isSymbol = (val) => typeof val === 'symbol';

export const isObject = (val) => val !== null && typeof val === 'object';

export const isPromise = (val) => {
  return isObject(val) && isFunction(val.then) && isFunction(val.catch);
};

// 获取类型
export const toRawType = (value) => {
  // return toTypeString(value).replace(/\[(\S+) (\S+)\]/, '$2');
  return toTypeString(value).slice(8, -1);
};

// 是否普通对象
export const isPlainObject = (val) => toTypeString(val) === '[object Object]';

// 正整数的key字符串
export const isIntegerKey = (key) => isString(key) && key !== 'NaN' && key[0] !== '-' && '' + parseInt(key, 10) === key;
