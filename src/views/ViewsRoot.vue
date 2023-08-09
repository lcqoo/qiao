<script setup>
import LayoutDefault from '@/components/root-layout/LayoutDefault.vue';
import { RouterView } from 'vue-router';
import { ref } from 'vue';
const myRouterAlive = ref(true);
</script>

<template>
  <div class="views_root layout-node">
    <template v-if="myRouterAlive">
      <LayoutDefault>
        <RouterView />
      </LayoutDefault>
    </template>

    <!-- 这里处理登录和第一次进入项目时的参数 -->
  </div>
</template>

<style scoped>
/* .views_root {} */
</style>
