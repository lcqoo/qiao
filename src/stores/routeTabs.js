// RouteTabs 组件专用

import { ref } from 'vue';
import { defineStore } from 'pinia';

// 过滤 route
const filterRoute = (route) => {
  if (!route) return null;
  if (typeof route === 'string') return route;
  let o = { ...route };
  if (Array.isArray(route.matched)) {
    o.matched = route.matched.map((item) => {
      item = { ...item };
      delete item.components;
      delete item.instances;
      return item;
    });
  }
  return o;
};

export const useRouteTabsStore = defineStore('routeTabs', () => {
  // 替换tab
  const routeTabsReplace = ref(null);
  // 打开（先查找已有tabItem）
  const routeTabsOpen = ref(null);
  // 根据path关闭tabItem
  const routeTabsClose = ref(null);
  // 是否激活了 RouteTabs 组件
  const isRouteTabs = ref(false);

  // 替换路由
  function updateRouteTabsReplace(route) {
    routeTabsReplace.value = filterRoute(route);
  }
  // 打开（先查找已有tabItem）
  function updateRouteTabsOpen(route) {
    routeTabsOpen.value = filterRoute(route);
  }
  // 关闭 tabItem
  function updateRouteTabsClose(path) {
    routeTabsClose.value = filterRoute(path);
  }

  return {
    routeTabsReplace,
    routeTabsOpen,
    routeTabsClose,
    isRouteTabs,
    updateRouteTabsReplace,
    updateRouteTabsOpen,
    updateRouteTabsClose,
  };
});
