import deepClone from '@/common/utils_deepClone';

/**
 * 复制属性
 * @param {Object} sourceObj 数据来源对象
 * @param {Object} targetObj 要复制到的目标对象
 * @param {String} key 复制的属性
 */
function handleDeepCopyAttr(sourceObj, targetObj, key) {
  if (!(sourceObj && typeof sourceObj === 'object')) {
    console.error(new Error('sourceObj-参数格式错误'));
    return false;
  }
  if (!(key in sourceObj)) {
    return false; // 如果数据源对象里没有的key就直接跳过
  }
  let val = sourceObj[key];
  if (val && typeof val === 'object') {
    val = deepClone(val);
  }

  targetObj[key] = val;
  return true;
}

/**
 * 数据备份
 */
class DataBackup {
  constructor(initObj, isShallow) {
    if (initObj) {
      if (isShallow) {
        Object.keys(initObj).forEach((key) => {
          this[key] = initObj[key];
        });
      } else {
        Object.keys(initObj).forEach((key) => {
          this[key] = deepClone(initObj[key]);
        });
      }
    }
  }

  /**
   * 备份数据
   * @param {Object} target 要交互的目标对象
   * @param {Boolean,String,Number} key:
   * key === false: key是target的所有属性
   * key === true: key是实例本身的所有属性
   * 或者指定要备份源对象的key
   */
  $backup(target, key = false) {
    const self = this; // 实例本身是被修改的对象
    if (key === false) {
      Object.keys(target).forEach((key) => {
        handleDeepCopyAttr(target, self, key);
      });
    } else if (key === true) {
      Object.keys(self).forEach((key) => {
        handleDeepCopyAttr(target, self, key);
      });
    } else {
      handleDeepCopyAttr(target, self, key);
    }
    return this;
  }
  // 使用实例备份的数据盖写目标对象的数据，参数如 backup
  $overwrite(target, key = false) {
    const self = this; // 实例本身是数据源
    if (key === false) {
      Object.keys(target).forEach((key) => {
        handleDeepCopyAttr(self, target, key);
      });
    } else if (key === true) {
      Object.keys(self).forEach((key) => {
        handleDeepCopyAttr(self, target, key);
      });
    } else {
      handleDeepCopyAttr(self, target, key);
    }
    return this;
  }

  /**
   * 给一个复制的属性
   */
  $getCopy(key) {
    return deepClone(this[key]);
  }
}

export default DataBackup;
