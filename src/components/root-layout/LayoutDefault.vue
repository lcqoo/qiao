<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// import $router from '@/router';
import RouteTabs from './RouteTabs.vue';

const route = useRoute();
const router = useRouter();
// console.log('router', router === $router, router);

const activeIndex = ref('/home');

const handleSelect = (index, indexPath) => {
  // console.log('handleSelect', index, indexPath);
  router.push({ path: index });
};

watch(
  route,
  (route) => {
    // console.log(`watch-route`, route);
    activeIndex.value = route.path;
  },
  { immediate: true }
);

// defineProps({
//   msg: {
//     type: String,
//     required: true,
//   },
// });
</script>

<template>
  <el-container class="root-layout-default layout-node">
    <el-header class="layout-header">
      <el-menu
        :default-active="activeIndex"
        class="layout-menu"
        mode="horizontal"
        background-color="#545c64"
        text-color="#fff"
        active-text-color="#ffd04b"
        @select="handleSelect"
      >
        <el-menu-item index="/home">Home</el-menu-item>
        <el-menu-item index="/about">About</el-menu-item>
        <el-sub-menu index="/demo">
          <template #title>demo</template>
          <el-menu-item index="/demo/page1">demo-page1</el-menu-item>
          <el-menu-item index="/demo/page2">demo-page2</el-menu-item>
        </el-sub-menu>

        <el-menu-item v-for="num in 6" :index="`/page-demo${num}`">page-demo{{ num }}</el-menu-item>
      </el-menu>
    </el-header>
    <el-main class="layout-main">
      <RouteTabs class="layout-node">
        <slot></slot>
      </RouteTabs>
    </el-main>
    <el-footer class="layout-footer">Footer</el-footer>
  </el-container>
</template>

<style lang="scss" scoped>
/* .root-layout-default {} */
.layout-header {
  padding: 0;
  height: 58px;
}
.layout-menu {
  border: none;
}
.layout-main {
  padding: 0;
}
.layout-footer {
  padding: 0;
}
</style>
