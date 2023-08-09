'use strict';

/**
 * 深度克隆
 */

// 获取传入值的类型
function getType(val) {
  return Object.prototype.toString.call(val).slice(8, -1);
}

// 获取函数的名称
function getFuncName(fn) {
  const match = fn && fn.toString().match(/^\s*function (\w+)/);
  return match ? match[1] : '';
}

// 函数是否为构造函数, 简单判断. 可构造性与`.prototype`没有直接关系, 这一切都与内部[`[[construct]]`]有关.
function isConstructor(fn) {
  if (typeof fn !== 'function') {
    return false;
  }
  return !!(fn.prototype && fn.prototype.constructor.name);
}

// 不需要 clone 的数据类型
function noCloneType(val) {
  return !(typeof val === 'object' && val !== null);
}

/**
 * 判断是否有某个函数属性, 且不是原形 Object.prototype 上的
 * @param {*} target 判断的目标
 * @param {String} propKey 要判断的属性
 * @param {String} typeName 原生构造函数的名称, 传值表示可以在原生构造函数里查
 * @returns {Boolean}
 */
function hasProtoFnPropValid(target, propKey, typeName) {
  if (target == null) {
    return false;
  }

  let func = target[propKey];

  if (typeof func === 'function') {
    if (func !== Object.prototype[propKey]) {
      return true;
    }
  }

  if (typeof target.constructor !== 'function' && typeName && typeName !== 'Object') {
    const TypeFn = window[typeName];
    if (isConstructor(TypeFn) && hasProtoFnPropValid(TypeFn, propKey)) {
      console.log(`hasProtoFnPropValid-!constructor`, ...arguments);
      return true;
    }
  }

  return false;
}

/**
 * 获取值转换字符串的结果
 * @param {*} value
 * @param {String} typeName
 * @returns {String}
 */
function getToString(value, typeName) {
  if (value == null) {
    return value + '';
  }

  if (typeof value.toString === 'function') {
    return value.toString();
  }

  // if (typeName == null) {
  //   typeName = getType(value);
  // }

  const TypeFn = window[typeName];
  if (isConstructor(TypeFn)) {
    return TypeFn.prototype.toString.call(value);
  }

  console.error(new Error(`意外的类型: ${typeName}`), value);
  return value + '';
}

/**
 * 获取原始值
 * @param {*} value 传入的值
 * @param {String} typeName 原生构造函数的名称
 * @returns rawVal 原生值
 */
function getRawValue(value, typeName) {
  if (typeof value !== 'object' || value == null) {
    return value;
  }

  if (typeof value.valueOf === 'function') {
    if (hasProtoFnPropValid(value, 'valueOf')) {
      // console.log(`getRawValue-value.prototype.valueOf`, typeName, value.valueOf());
      return value.valueOf();
    }
  }

  // if (typeName == null) {
  //   typeName = getType(value);
  // }

  const TypeFn = window[typeName];
  if (isConstructor(TypeFn)) {
    // console.log(`getRawValue-value`, typeName, value);
    // console.log(`getRawValue-rawVal`, TypeFn.prototype.valueOf.call(value));
    return TypeFn.prototype.valueOf.call(value);
  }

  console.error(new Error(`意外的类型: ${typeName}`), value);
  return value;
}

/**
 * window.structuredClone
 */
const _structuredClone = (function () {
  if (window.structuredClone) {
    return window.structuredClone;
  }

  console.warn(new Error(`缺少 structuredClone 方法支持`));

  // 这里只是一个简单的替代, 支持部分类型
  return function structuredClone(value) {
    const typeName = getType(value);
    const TypeFn = window[typeName];
    const Constructor = value.constructor;
    let cloneVal;

    if (isConstructor(TypeFn)) {
      if (typeof Constructor === 'function' && Constructor !== TypeFn) {
        console.error(new Error(`意外的自定义: ${typeName}; 函数名: ${getFuncName(Constructor)}`), value);
        cloneVal = new Constructor();
      } else {
        cloneVal = new TypeFn(getRawValue(value, typeName));
      }
    } else {
      console.error(new Error(`意外的类型: ${typeName}`), value);
      if (typeof Constructor === 'function') {
        cloneVal = new Constructor();
      }
    }

    // console.log(`structuredClone`, typeName, value, cloneVal);
    return cloneVal;
  };
})();

/**
 * 深度克隆, 原型链保持相同
 * @param {*} target 要克隆的对象
 * @param {WeakMap, Map} cache 存储克隆过的对象
 * @returns {*} 克隆后的值
 */
export default function deepClone(target, cache = new WeakMap()) {
  if (noCloneType(target)) {
    return target;
  }

  if (cache.has(target)) {
    return cache.get(target);
  }

  let copyTarget;
  const typeName = getType(target);
  switch (typeName) {
    case 'Object': {
      let proto = Object.getPrototypeOf(target);
      if (proto === void 0) {
        proto = null;
      }
      copyTarget = Object.create(proto);
      cache.set(target, copyTarget); // 提前写入缓存

      Object.getOwnPropertyNames(target).forEach((key) => {
        const descriptor1 = Object.getOwnPropertyDescriptor(target, key);
        descriptor1.value = deepClone(descriptor1.value, cache);
        Object.defineProperty(copyTarget, key, descriptor1);
      });
      break;
    }
    case 'Array': {
      copyTarget = [];
      cache.set(target, copyTarget);

      target.forEach((item, index) => {
        copyTarget[index] = deepClone(item, cache);
      });
      break;
    }
    case 'Map': {
      copyTarget = new Map();
      cache.set(target, copyTarget);

      target.forEach(function (value, key) {
        // 对象类型的值被拷贝后可能无法访问到
        copyTarget.set(deepClone(key, cache), deepClone(value, cache));
      });
      break;
    }
    case 'Set': {
      copyTarget = new Set();
      cache.set(target, copyTarget);

      target.forEach(function (item) {
        // 对象类型的值被拷贝后可能无法访问到
        copyTarget.add(deepClone(item, cache));
      });
      break;
    }
    case 'WeakMap': {
      copyTarget = new WeakMap();
      cache.set(target, copyTarget);
      console.log(`deepClone-不复制内部属性的类型: ${typeName}`);
      break;
    }
    case 'WeakSet': {
      copyTarget = new WeakSet();
      cache.set(target, copyTarget);
      console.log(`deepClone-不复制内部属性的类型: ${typeName}`);
      break;
    }
    case 'Arguments': {
      copyTarget = new target.constructor();
      cache.set(target, copyTarget);

      Object.keys(target).forEach((key) => {
        copyTarget[key] = deepClone(target[key], cache);
      });
      break;
    }
    // case 'RegExp': {
    //   copyTarget = new RegExp(target);
    //   cache.set(target, copyTarget);
    //   break;
    // }
    default: {
      // 剩下的类型就交给 structuredClone 方法了; 例如: new RegExp() new Date() new Error() new String() new Boolean() new Number()
      copyTarget = _structuredClone(target);
      cache.set(target, copyTarget);

      if (target === copyTarget) {
        console.log(`deepClone-default: ${typeName} 相等`);
      } else if (hasProtoFnPropValid(target, 'valueOf', typeName)) {
        if (getRawValue(target, typeName) !== getRawValue(copyTarget, typeName)) {
          console.warn(`deepClone-default: ${typeName} valueOf不相等`, target, copyTarget);
        }
      } else if (hasProtoFnPropValid(target, 'toString', typeName)) {
        if (getToString(target, typeName) !== getToString(copyTarget, typeName)) {
          console.warn(`deepClone-default: ${typeName} toString不相等`, target, copyTarget);
        } else {
          console.log(`deepClone-default: ${typeName} toString相等-str`, getToString(target, typeName));
        }
      } else {
        console.warn(`deepClone-default: ${typeName} 可能不相等`, target, copyTarget);
      }
    }
  }

  // 原型链保持相同
  // let targetProto = Object.getPrototypeOf(target);
  // if (Object.getPrototypeOf(copyTarget) !== targetProto) {
  //   if (!noCloneType(targetProto) && cache.has(targetProto)) {
  //     targetProto = cache.get(targetProto);
  //     console.log(`原型链改变-且原形被clone: ${typeName}`, target);
  //   }
  //   // console.log(`原型链改变了: ${typeName}`, target, Object.getPrototypeOf(copyTarget));
  //   // 这里修改了原型为原来对象的原型, 但没有测试影响. Vue会修改数组的原型
  //   Object.setPrototypeOf(copyTarget, targetProto);
  // }

  return copyTarget;
}
