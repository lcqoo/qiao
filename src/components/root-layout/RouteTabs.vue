<script setup>
import {
  //
  inject,
  provide,
  ref,
  toRef,
  computed,
  watch,
  nextTick,
  onBeforeUnmount,
} from 'vue';
import { useRouteTabsStore } from '@/stores/routeTabs';
import { useKeepRouteQueryStore } from '@/stores/common';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Close, Refresh } from '@element-plus/icons-vue';
import { storageAvailable } from '@/common/$utils';

const myStore = useRouteTabsStore();
const routeTabsReplace = toRef(myStore, 'routeTabsReplace');
const routeTabsOpen = toRef(myStore, 'routeTabsOpen');
const routeTabsClose = toRef(myStore, 'routeTabsClose');
const isRouteTabs = toRef(myStore, 'isRouteTabs');
const { updateRouteTabsReplace, updateRouteTabsOpen, updateRouteTabsClose } = myStore;
const keepRouteQueryStore = useKeepRouteQueryStore();
// console.log(`myStore`, myStore);
// console.log('routeTabsReplace', routeTabsReplace);
// console.log(`myStore.routeTabsReplace`, myStore.routeTabsReplace);

// 刷新当前页面
const reload = inject('reload', () => {
  console.error('没有刷新方法');
  ElMessage.error('没有刷新方法');
});

// 系统统一返回
const handleGoBack = inject('handleGoBack', () => {
  console.error('没有 handleGoBack');
  ElMessage.error('没有 handleGoBack');
});

// 根path
const systemRootPath = inject('systemRootPath', '/');

const props = defineProps({
  // 当前登录人的账号
  // userCode: { type: String, required: true, default: '' },
  // 控制销毁pane内的页面,用于配合页面刷新.
  destroyPane: Boolean,
  // 菜单列表
  menuList: { type: Array, default: () => [] },
  // 脚部内容
  footer: String,
});

const $router = useRouter();
const $route = useRoute();

// 最大拥有的标签数
const routeTabMaximun = 10;
// 缓存统一名称开头
const storageKey = 'RouteTabs';
// 缓存可用
let storageIsAvailable = true;
// 要缓存的辅助数据，不包括routeTabList
const storageData = {
  routeTabsOwner: '', // tabs数据属主
};
// 比较url参数时忽略的参数
const diffParamsIgnore = ['goBack', 'PackTabs'];

// 标签的横向滚动
const navTabsLeft = ref(0);
// 销毁指定path的缓存
const destroyPath = ref(null);
// tabs数据
const routeTabList = ref([]);

//
const navArea = ref();

// tabs列表
const tabsNavList = computed(() => {
  const currentPath = $route.path;
  let list = [];
  routeTabList.value.forEach((item, index) => {
    let label = item.title || item.name;
    let title;
    if (!label) {
      label = item.path || '--';
      title = item.path;
    } else {
      title = `${label}: ${item.path}`;
    }
    let obj = {
      key: item.path,
      path: item.path,
      label,
      title,
      activeState: 0,
      closable: true,
      data: item,
    };
    if (obj.path === currentPath) {
      obj.activeState = 1;
      if (index > 0) {
        list[index - 1].activeState = 2;
      }
    }
    list.push(obj);
  });
  if (list.length === 1) {
    list[0].closable = false;
  }
  return list;
});

defineOptions({
  directives: {
    // 指令tabs更新
    navTabsLeft: {
      updated(navTabs) {
        try {
          let navArea = navTabs.parentNode;
          const navTabsWidth = navTabs.offsetWidth;
          const navAreaWidth = navArea.offsetWidth;
          let maxLeft = 0;
          let minLeft = Math.min(navAreaWidth - navTabsWidth, maxLeft);
          if (Number.isNaN(minLeft)) throw `minLeft 值异常 (${navTabsWidth}, ${navAreaWidth})`;
          let scrollLeft = +navTabs.dataset.left || 0;
          if (scrollLeft > maxLeft) {
            scrollLeft = maxLeft;
          } else if (scrollLeft < minLeft) {
            scrollLeft = minLeft;
          }
          let left = navTabs.style.left || '0';
          left = +left.replace(/px$/i, '');
          if (Number.isNaN(left)) throw `navTabs.style.left 值异常 (${navTabs.style.left})`;
          if (left !== scrollLeft) {
            navTabs.style.left = scrollLeft + 'px';
            // 上级元素宽度变大时可能不会触发这个更新, left小于0的值会导致右侧露出, 使用浮动子元素填充
            navTabs.lastElementChild.style.width = 0 - scrollLeft + 'px';
          }
          // console.log(`directives-navTabsLeft`, scrollLeft);
        } catch (error) {
          console.error(error);
        }
      },
    },
    // 指令激活tab
    navItemActive: {
      beforeUpdate(el, binding) {
        let { value, oldValue } = binding;
        if (!(value && !oldValue)) {
          return;
        }
        try {
          let navTabs = el.parentNode;
          let navArea = navTabs.parentNode;
          let tabRect = el.getBoundingClientRect();
          let navAreaRect = navArea.getBoundingClientRect();
          let hideNum = 0;
          if (tabRect.left < navAreaRect.left) {
            hideNum = tabRect.left - navAreaRect.left;
          } else if (tabRect.right > navAreaRect.right) {
            hideNum = tabRect.right - navAreaRect.right;
          }
          if (hideNum) {
            let left = +navTabs.dataset.left || 0;
            navTabs.dataset.left = Math.floor(left - hideNum);
            // console.log(`directives-navItemActive`, arguments.length, el, navTabs.dataset.left);
          }
        } catch (error) {
          console.error(error);
        }
      },
    },
  },
});

// 是否对象
const isObject = (val) => {
  return Object.prototype.toString.call(val) === '[object Object]';
};

// 设置缓存数据
const setStorageData = () => {
  let data = {};
  data.routeTabsOwner = props.userCode;
  data.routeTabList = routeTabList.value;
  sessionStorage.setItem(storageKey, JSON.stringify(data));
};
// 获取缓存的数据
const getStorageData = () => {
  let data = null;
  let dataStr = sessionStorage.getItem(storageKey);
  if (dataStr) {
    try {
      data = JSON.parse(dataStr);
    } catch (error) {
      console.error(error);
    }
  }
  return data;
};

// 修改routeTabList的统一方法
const setRouteTabList = (tabList) => {
  routeTabList.value = tabList;
  if (storageIsAvailable) {
    setStorageData();
  }
};

// 刷新对应路径的缓存
const flickerDestroyPath = (path, callback) => {
  if (!path) {
    callback && callback();
  } else {
    destroyPath.value = path;
    nextTick(function () {
      destroyPath.value = null;
      callback && callback();
    });
  }
};

// 从 route 获取 tabItem 数据；
const handleRouteToTab = (route) => {
  let o = {};
  if (!route) return o;
  let { path, name, fullPath, meta, query, params, matched } = route;
  if (!meta) {
    // 如果 route 是 tabItem 时没有meta
    meta = {
      title: route.title,
      notKeepAlive: route.notKeepAlive,
      diffParamsIgnore: route.diffParamsIgnore,
      tabsFindRule: route.tabsFindRule,
      tabsFindKey: route.tabKey,
      paramsDiffKeys: route.paramsDiffKeys,
    };
  }
  o.path = path || '';
  o.name = name;
  o.title = meta.title || ''; // 在meta里获取title
  o.activeTime = Date.now(); // 标签激活时间
  o.notKeepAlive = !!meta.notKeepAlive; // 不缓存
  o.diffParamsIgnore = meta.diffParamsIgnore; // {Array,Boolean} 替换tab时对比查询参数时忽略的参数
  o.tabsFindRule = meta.tabsFindRule; // 查找相同标签时的比较规则
  o.tabKey = meta.tabsFindKey;
  o.paramsDiffKeys = Array.isArray(meta.paramsDiffKeys) ? [...meta.paramsDiffKeys] : null;
  o.fullPath = fullPath || '';
  o.query = Object.assign({}, query);
  o.params = Object.assign({}, params);
  // if (Array.isArray(matched) && matched.length) {
  //   o.regexStr = matched[matched.length - 1].regex.toString();
  // }
  if (name) {
    // 从菜单获取 title TODO 使用函数参数
    let title;
    const menuItemSome = (item) => {
      if (!item) return false;
      if (item.isPage) {
        if (item.name && item.name === name) {
          title = item.title;
          return true;
        }
        return false;
      } else if (item.name && item.name === name) {
        title = item.title;
        return true;
      } else if (Array.isArray(item.children)) {
        return item.children.some((o) => menuItemSome(o));
      }
      return false;
    };
    props.menuList.some((item) => menuItemSome(item));
    if (title) {
      o.title = title;
    }
  }
  return o;
};
// 比较两个路由的参数，确定不一样则返回true
const handleDiffParams = (objA, objB, ignore = []) => {
  ignore = [...new Set(ignore)];
  if (!isObject(objA) || !isObject(objB)) {
    console.warn('参数错误');
    return false;
  }
  let keysA = Object.keys(objA).filter((k) => !ignore.includes(k));
  let keysB = Object.keys(objB).filter((k) => !ignore.includes(k));
  let keysMerge = [];
  keysA.concat(keysB).forEach((val) => {
    if (!keysMerge.includes(val)) {
      keysMerge.push(val);
    }
  });
  if (keysMerge.length !== keysA.length || keysMerge.length !== keysB.length) {
    return true;
  }
  return keysMerge.some((key) => objA[key] !== objB[key]);
};
/**
 * 再routeTabList里查找tab
 * @param {Object} route 路由信息
 * @param {Boolean} global 是否执行全局匹配(查找所以匹配而非在找到第一个匹配后停止)
 * @returns {global ? Array : Number} index
 */
const findIndexTabs = (route, global) => {
  let arrIndex = [];
  const noGlobal = !global;
  if (typeof route === 'string') {
    route = { path: route };
  } else if (!isObject(route)) {
    route = null;
    console.error('参数错误');
  }
  if (route) {
    let meta = route.meta;
    if (!meta) {
      meta = {
        tabsFindRule: route.tabsFindRule,
        tabsFindKey: route.tabKey,
        paramsDiffKeys: route.paramsDiffKeys,
      };
    }
    let { tabsFindRule, paramsDiffKeys } = meta;
    let routeParams = route.params || {};
    if (paramsDiffKeys && !Array.isArray(paramsDiffKeys)) {
      paramsDiffKeys = [paramsDiffKeys];
    }
    const handleDiff = (item) => {
      let matchVal = true;
      if (paramsDiffKeys && paramsDiffKeys.length) {
        let itemParams = item.params;
        if (!itemParams) {
          console.error('缺少必要数据');
        }
        matchVal = paramsDiffKeys.every((key) => {
          let rVal = routeParams[key];
          let iVal = itemParams[key];
          if (rVal === iVal) return true;
          if (typeof rVal === 'number' || typeof iVal === 'number') {
            if (String(rVal) === String(iVal)) return true;
          }
          return false;
        });
      }
      return matchVal;
    };
    const routePath = route.path;
    const paths = [routePath];
    // 可能有些path不一样但是等效的,tabList里的路由都不会指向相同的资源才能保证切换tab时不会无效
    let matched = route.matched || [];
    if (matched.length) {
      let pathIndex = -1;
      let pathRegexStr = '';
      matched.some((item, index) => {
        if (item.path === routePath) {
          pathIndex = index;
          if (item.regex) {
            pathRegexStr = item.regex.toString();
          }
          return true;
        }
        return false;
      });
      if (pathIndex !== -1 && pathRegexStr) {
        matched.forEach((item, index) => {
          if (pathIndex === index) return;
          if (pathRegexStr === item.regex.toString()) {
            paths.push(item.path);
          }
        });
      }
    }
    // if (paths.length > 1) {
    //   console.log('findIndexTabs-多个等效路由', paths);
    // }
    routeTabList.value.some((item, index) => {
      if (paths.includes(item.path)) {
        // path匹配是默认比较规则,且优先于其他规则
        arrIndex.push(index);
        return noGlobal;
      }
      if (tabsFindRule === 'name') {
        if (item.name === route.name) {
          if (handleDiff(item)) {
            arrIndex.push(index);
            return noGlobal;
          }
        }
      } else if (tabsFindRule === 'tabKey') {
        if (meta.tabsFindKey && meta.tabsFindKey === item.tabKey) {
          if (handleDiff(item)) {
            arrIndex.push(index);
            return noGlobal;
          }
        }
      }
      return false;
    });
  }
  if (noGlobal) {
    if (arrIndex.length) {
      return arrIndex[0];
    }
    return -1;
  }
  return arrIndex;
};

/**
 * 替换tab
 * @param {Object} route
 * @param {Number, String} aim 要替换目标，一般用不上
 * @returns {Boolean} success 替换是否成功
 */
const replaceTab = (route, aim) => {
  if (!route) return false;
  let aimIndex, aimPath;
  typeof aim === 'number' ? (aimIndex = aim) : (aimPath = aim);
  if (aimIndex == null) {
    if (!(typeof aimPath === 'string' && aimPath)) aimPath = $route.path;
    aimIndex = findIndexTabs(aimPath);
  }
  if (aimIndex > -1 && aimIndex <= routeTabList.value.length) {
    let tabList = [...routeTabList.value];
    tabList.splice(aimIndex, 1, handleRouteToTab(route));
    setRouteTabList(tabList);
    return true;
  }
  return false;
};
/**
 * 替换当前页tab，去除当前页的缓存，之后会执行 $router.replace 方法
 */
const handleReplace = (route) => {
  replaceTab(route);
  flickerDestroyPath(route.path, () => {
    $router.replace(route);
  });
};
/**
 * 先查找 routeTabList 里是否有，有就切换，没有就添加；
 * @param {Object} route
 * @returns {Promise}
 */
const openTab = (route) => {
  return new Promise((resolve, reject) => {
    if (!route) {
      console.warn('参数错误', route);
      return reject('参数错误');
    }
    let index = findIndexTabs(route);
    if (index > -1) {
      let tabItem = routeTabList.value[index];
      $router.push({ path: tabItem.path, query: tabItem.query }).then(
        (param) => resolve(param),
        (err) => {
          console.error(err);
          reject(err);
        }
      );
    } else {
      $router.push(route).then(
        (param) => resolve(param),
        (err) => {
          console.error(err);
          reject(err);
        }
      );
    }
  });
};
/**
 * tabs跟着route更新
 * @param {Object} route
 * @param {Boolean} global 是否执行全局匹配 (查找所以匹配而非在找到第一个匹配后停止)
 */
const followRoute = (route, global) => {
  if (!route) {
    route = $route;
  }
  let tabList = [...routeTabList.value];
  let index = -1;
  if (global) {
    // 检查重复，特殊情况下可能会在运行中出现多个重复的（如404页等）
    let arrIndex = findIndexTabs(route, true);
    if (arrIndex.length === 1) {
      index = arrIndex[0];
    } else if (arrIndex.length > 1) {
      index = arrIndex.shift();
      arrIndex.reverse();
      // 直接去掉其他重复的
      arrIndex.forEach((i) => {
        tabList.splice(i, 1);
      });
    }
  } else {
    index = findIndexTabs(route);
  }
  let tabItem = handleRouteToTab(route);
  if (index > -1) {
    if (tabItem.diffParamsIgnore !== true) {
      let diffIgnore = diffParamsIgnore;
      if (Array.isArray(tabItem.diffParamsIgnore)) {
        diffIgnore = diffIgnore.concat(tabItem.diffParamsIgnore);
      }
      if (
        handleDiffParams(tabItem.query, tabList[index].query, diffIgnore) ||
        handleDiffParams(tabItem.params, tabList[index].params, diffIgnore)
      ) {
        // 默认和替换的页面的查询参数不一样就刷新，
        // 默认和页面内容无关的参数可以加入忽略列表 diffParamsIgnore
        // console.log('如果和替换的页面的查询参数不一样就刷新');
        reload();
      }
    }
    // 替换判断为相同的标签
    tabList.splice(index, 1, tabItem);
  } else {
    let minTimeIndex = 0;
    let maxTimeIndex = 0;
    try {
      tabList.forEach((item, index, arr) => {
        // 获取最早和最晚激活时间对应的 index
        if (item.activeTime < arr[minTimeIndex].activeTime) {
          minTimeIndex = index;
        } else if (item.activeTime > arr[maxTimeIndex].activeTime) {
          maxTimeIndex = index;
        }
      });
    } catch (err) {
      console.error(err);
    }
    if (tabList.length >= routeTabMaximun) {
      // tabList 接近最大长度时删除最早出现的标签
      tabList.splice(minTimeIndex, 1);
    }
    // 在最晚出现的标签后面添加新标签
    tabList.splice(maxTimeIndex + 1, 0, tabItem);
  }
  setRouteTabList(tabList);
};
// 关闭 tab
const closeTab = (path) => {
  if (!path) {
    console.warn('closeTab-空参数', path);
  }
  let isChange = path === $route.path; // 需要切换tab
  let itemChange = null; // 要切换到的tab
  let listClose = []; // 关闭的tab
  let tabList = routeTabList.value.filter((item) => {
    if (item.path === path) {
      listClose.push(item);
      return false;
    }
    if (isChange) {
      // 选择活跃时间最新的标签作为下一个要切换的标签
      if (!itemChange || !itemChange.activeTime || itemChange.activeTime < item.activeTime) {
        itemChange = item;
      }
    }
    return true;
  });
  // console.log('closeTab-listClose', listClose);
  if (!tabList.length) {
    let rootRoute = $router.resolve(systemRootPath).route;
    let itemClose = listClose[0];
    if (itemClose.path === rootRoute.path) {
      tabList = [itemClose];
      reload();
      console.log('closeTab-刷新');
    } else {
      $router.push({ path: systemRootPath, query: { ...keepRouteQueryStore.keepRouteQuery.value } });
    }
  } else if (isChange) {
    selectTab(itemChange);
  }
  setRouteTabList(tabList);
};
// 关闭其他tab
const closeOtherTab = () => {
  setRouteTabList([handleRouteToTab($route)]);
};
// tab 切换
const selectTab = (tabItem) => {
  if (!tabItem) return;
  let nowPath = $route.path;
  const routerParams = {
    path: tabItem.path,
    query: tabItem.query,
  };
  if (routerParams.path === nowPath) return;
  //
  $router.push(routerParams, null, (params) => {
    // 切换失败处理
    console.log('selectTab.onAbort', params, tabItem);
    let resolve = $router.resolve(routerParams);
    try {
      if (resolve.route.path === nowPath) {
        // 可能是不同path都指向同一个路由
        closeTab(routerParams.path);
        console.log('selectTab-closeTab', routerParams.path);
      }
    } catch (error) {
      console.error('selectTab-error', error);
    }
  });
};

// 滚动方法
const scrollTabList = (offset) => {
  offset = parseInt(offset);
  if (isNaN(offset)) {
    return console.error('参数异常');
  }
  try {
    const navTabs = navArea.value.firstElementChild;
    const navAreaWidth = navArea.value.offsetWidth;
    const navTabsWidth = navTabs.offsetWidth;
    let currentLeft = +navTabs.dataset.left || 0;
    let left = 0;
    if (navAreaWidth < navTabsWidth) {
      if (offset > 0) {
        left = Math.min(currentLeft + offset, 0);
      } else {
        left = Math.max(currentLeft + offset, navAreaWidth - navTabsWidth);
      }
    }
    navTabs.dataset.left = left;
    navTabsLeft.value = left;
    // console.log(`scrollTabList`, left, offset, navArea, navAreaWidth, navTabsWidth);
  } catch (error) {
    console.error(error);
  }
};
// 鼠标滚动
const onMouseScroll = (event) => {
  // console.log(`onMouseScroll`, event);
  let type = event.type;
  let wheelDelta = 0;
  if (type === 'DOMMouseScroll' || type === 'mousewheel') {
    wheelDelta = event.wheelDelta || -(event.deltaY || 0) * 40;
  }
  scrollTabList(wheelDelta);
};

/**
 * 修改全局返回方法
 */
const handleGoBackProvide = (opt) => {
  handleGoBack(opt, {
    handleRouterPush,
    handleRouterBack,
  });
};
const handleRouterPush = (location) => {
  return new Promise((resolve, reject) => {
    const oldPath = $route.path;
    openTab(location).then(
      (param) => {
        closeTab(oldPath);
        resolve(param);
      },
      (err) => reject(err)
    );
  });
};
const handleRouterBack = () => {
  //TODO 要改为判断tab是否可以关闭切换
  const oldPath = $route.path;
  $router.go(-1);
  setTimeout(() => {
    if ($route.path !== oldPath) {
      closeTab(oldPath);
    } else {
      console.warn('标签未关闭');
    }
  }, 100);
};

provide('inRouteTabs', true);
// provide('routeTabs', this); // TODO
provide('handleGoBack', handleGoBackProvide);

// 初始化开始-------------------------
//
isRouteTabs.value = true;
//
if (!storageAvailable('sessionStorage')) {
  console.warn(`缓存不可用，这会导致tabs数据不能再页面刷新后恢复`);
  storageIsAvailable = false;
}
// 读取缓存数据
if (storageIsAvailable) {
  let storageData = getStorageData();
  if (storageData) {
    let { routeTabList: _routeTabList, routeTabsOwner } = storageData;
    if (routeTabsOwner === props.userCode) {
      if (Array.isArray(_routeTabList) && _routeTabList.length) {
        try {
          routeTabList.value = _routeTabList.filter((item) => !!(item && item.path)).slice(0, routeTabMaximun);
        } catch (error) {
          console.error(error);
        }
      }
    }
  }
}
// 对通过vuex触发事件的支持
updateRouteTabsReplace(null);
watch(routeTabsReplace, (route) => {
  if (route) {
    updateRouteTabsReplace(null);
    handleReplace(route);
  }
});
// 根据path关闭tab
updateRouteTabsClose(null);
watch(routeTabsClose, (path) => {
  if (path) {
    updateRouteTabsClose(null);
    closeTab(path);
  }
});
// 打开(先查找已有tab)
updateRouteTabsOpen(null);
watch(routeTabsOpen, (route) => {
  if (route) {
    updateRouteTabsOpen(null);
    openTab(route);
  }
});
// // 主动刷新当前tab信息
// watch(tabsData.refreshTab, (val) => {
//   replaceTab($route);
// });
// 根据路由创建或切换标签
watch(
  $route,
  (to) => {
    followRoute(to, true);
  },
  { immediate: true }
);
// 初始化结束-------------------------

onBeforeUnmount(() => {
  isRouteTabs.value = false;
});
</script>

<template>
  <div class="cpt-route_tabs">
    <div class="route_tabs-header">
      <div class="route_tabs-nav-area" ref="navArea" @DOMMouseScroll="onMouseScroll" @mousewheel="onMouseScroll">
        <div class="route_tabs-nav-tabs" data-left="0" v-navTabsLeft="navTabsLeft">
          <div
            v-for="(navItem, navIndex) in tabsNavList"
            :key="navItem.key"
            v-navItemActive="navItem.activeState === 1"
            class="nav_item"
            :class="{
              'is-active': navItem.activeState === 1,
              'is-before-active': navItem.activeState === 2,
            }"
            style="cursor: pointer"
            @click="selectTab(navItem.data)"
          >
            <div
              class="nav_item-body nav_item-route"
              :class="{
                'is-active': navItem.activeState === 1,
                'is-before-active': navItem.activeState === 2,
              }"
            >
              <span class="nav_item-content">
                <span class="nav_item-icon" :class="{ 'is-active': navItem.activeState === 1 }">●</span>
                <span :title="navItem.title">{{ navItem.label }}</span>
              </span>

              <span class="nav_item-close-wrap" v-if="navItem.closable">
                <span class="nav_item-close" @click.stop="closeTab(navItem.path)">
                  <el-icon size="1em"><Close /></el-icon>
                </span>
              </span>

              <span class="nav_item-split" v-show="navIndex > 0"></span>
            </div>
          </div>

          <div class="nav_item" style="flex: 1 1 0%">
            <div class="nav_item-body nav_item-filler">
              <span class="nav_item-split"></span>
            </div>
          </div>

          <div class="nav_item" style="position: absolute; left: 100%; width: 0">
            <div class="nav_item-body nav_item-filler" style="padding: 0"></div>
          </div>
        </div>
      </div>

      <div class="route_tabs-handles-area">
        <div class="route_tabs-handles">
          <div class="route_tabs-reload" @click="reload()" title="刷新当前tab页">
            <el-icon size="1em"><Refresh /></el-icon>
          </div>
          <div class="route_tabs-close_other" @click="closeOtherTab()" title="关闭其他tab页">
            <span>关闭其他</span>
          </div>
        </div>
      </div>
    </div>

    <div class="route_tabs-neck">
      <slot name="neck"><div class="route_tabs-neck-inner"></div></slot>
    </div>

    <div class="route_tabs-content">
      <div class="route_tabs-pane" v-if="!routeTabList.length && !props.destroyPane">
        <slot></slot>
      </div>

      <template v-for="item in routeTabList">
        <template v-if="item.notKeepAlive">
          <div class="route_tabs-pane" :key="item.path" v-if="item.path === $route.path && !props.destroyPane">
            <slot></slot>
          </div>
        </template>
        <template v-else>
          <div
            class="route_tabs-pane"
            :key="item.path"
            v-if="item.path !== destroyPath && (!props.destroyPane || item.path !== $route.path)"
            v-show="$route.path === item.path"
          >
            <keep-alive><slot v-if="item.path === $route.path"></slot></keep-alive>
          </div>
        </template>
      </template>
    </div>

    <div class="route_tabs-footer">
      <slot name="footer"><div class="route_tabs-footer-inner" v-html="footer"></div></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$my-color-bg-base: #f1f3f5;
$my-color-bg-base-hover: #f8fafc;
$my-color-bg-content: #fff;
$my-radius-tab: 8px;
$my-border-color: #e8eaec;
$my-color-bg-close: rgba(127, 127, 127, 0.3);

@mixin border_s_c() {
  border-style: solid;
  border-color: $my-border-color;
}

.cpt-route_tabs {
  box-sizing: border-box;
  display: flex;
  flex-flow: column nowrap;
  background-color: $my-color-bg-base;
}

.route_tabs-header {
  box-sizing: border-box;
  flex: none;
  position: relative;
  @include border_s_c();
  border-top-width: 1px;
  border-left-width: 1px;
  border-right-width: 1px;
  display: flex;
  line-height: 30px;
  font-size: 14px;
  background-color: $my-color-bg-content;
}
.route_tabs-neck {
  flex: none;
  position: relative;
}
.route_tabs-neck-inner {
  padding-top: 5px;
  padding-bottom: 5px;
}

.route_tabs-footer {
  flex: none;
  position: relative;
  padding: 0;
  font-size: 14px;
  text-align: center;
  background-color: $my-color-bg-base;
  color: #8c8c8c;
}
.route_tabs-footer-inner {
  line-height: 26px;
  padding-top: 7px;
  padding-bottom: 7px;
}

.route_tabs-content {
  flex: 1 1 0%;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  margin-left: 16px;
  margin-right: 16px;
  border-radius: 4px;
  padding: 0 20px 10px;
  box-shadow: 1px 2px 8px #e8e8e8;
  background-color: $my-color-bg-content;
}

.route_tabs-pane {
  box-sizing: border-box;
  position: relative;
  height: 100%;
  width: 100%;
  overflow: auto;
}

.route_tabs-nav-area {
  box-sizing: border-box;
  height: 100%;
  flex: 1;
  overflow: hidden;
}
.route_tabs-nav-tabs {
  box-sizing: border-box;
  position: relative;
  display: inline;
  display: inline-flex;
  height: 100%;
  width: auto;
  min-width: 100%;
  transition: left 0.3s ease;
  white-space: nowrap;
}
.nav_item {
  box-sizing: border-box;
  position: relative;
  height: 100%;
  flex: none;
  overflow: hidden;
  vertical-align: top;
  background-color: $my-color-bg-base;
  transition: all 0.3s ease;
  &:hover,
  &:hover + .nav_item,
  &.is-active,
  &.is-active + .nav_item {
    .nav_item-split {
      background-color: transparent;
    }
  }
  &.is-active {
    background-color: $my-color-bg-content;
    .nav_item-body {
      background-color: $my-color-bg-base;
      border-bottom-color: transparent;
      border-top-left-radius: $my-radius-tab;
      border-top-right-radius: $my-radius-tab;
    }
  }
  &.is-before-active {
    .nav_item-body {
      border-bottom-right-radius: $my-radius-tab;
    }
  }
  &.is-active + .nav_item {
    .nav_item-body {
      border-bottom-left-radius: $my-radius-tab;
    }
  }
}
.nav_item-body {
  box-sizing: border-box;
  height: 100%;
  @include border_s_c();
  border-bottom-width: 1px;
  padding-left: 10px;
  padding-right: 8px;
  display: flex;
  background-color: $my-color-bg-content;
  transition: all 0.3s ease;
}
.nav_item-route {
  &:hover {
    background-color: $my-color-bg-base-hover;
    border-bottom-color: $my-color-bg-base-hover;
  }
}
.nav_item-split {
  position: absolute;
  top: 5px;
  bottom: 5px;
  left: 0;
  width: 1px;
  background-color: #ddd;
  transition: all 0.3s ease;
}
.nav_item-content {
  flex: none;
  padding-right: 8px;
}
.nav_item-icon {
  color: #ddd;
  padding-right: 8px;
  &.is-active {
    color: var(--color-primary);
  }
}
.nav_item-close-wrap {
  flex: none;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
.nav_item-close {
  border-radius: 100%;
  font-size: inherit;
  line-height: 1;
  padding: 0 1px;
  text-align: center;
  cursor: pointer;
  opacity: 0.5;
  &:hover {
    opacity: 1;
    background-color: $my-color-bg-close;
  }
  & > i {
    font-size: inherit;
  }
}

.route_tabs-handles-area {
  flex: none;
  background-color: $my-color-bg-content;
}
.route_tabs-handles {
  @include border_s_c();
  border-bottom-width: 1px;
  display: flex;
  & > * {
    flex: none;
    cursor: pointer;
    @include border_s_c();
    border-left-width: 1px;
    padding: 0 8px;
    &:hover {
      background-color: $my-color-bg-base-hover;
    }
  }
  i {
    font-size: 16px;
  }
}
</style>
