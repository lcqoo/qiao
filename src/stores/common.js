import {
  //
  // ref,
  shallowRef,
  reactive,
} from 'vue';
import { defineStore } from 'pinia';
import { isPlainObject } from '@/common/$types';

/**
 * 尺寸变化事件
 */
export const useResizeEventStore = defineStore('resizeEvent', () => {
  // 尺寸变化触发
  const resizeEvent = reactive({ timeStamp: 0, source: '' });

  //
  function updateResizeEvent(source) {
    resizeEvent.source = source + '';
    resizeEvent.timeStamp = Date.now();
    // console.log('resizeEvent’,source);
  }

  return { resizeEvent, updateResizeEvent };
});

/**
 * 需要在页面跳转时保留的参数
 */
export const useKeepRouteQueryStore = defineStore('keepRouteQuery', () => {
  // 需要在页面跳转时保留的参数
  const keepRouteQuery = shallowRef({});

  //
  function updateKeepRouteQuery(payload) {
    if (isPlainObject(payload)) {
      keepRouteQuery.value = { ...payload };
      console.log(`keepRouteQuery-保留参数:`, Object.keys(keepRouteQuery.value).join() || '无');
    } else {
      console.error(`keepRouteQuery: 参数格式错误`);
    }
  }
  function addKeepRouteQuery(payload) {
    if (isPlainObject(payload)) {
      keepRouteQuery.value = { ...keepRouteQuery.value, ...payload };
      console.log(`keepRouteQuery-保留参数:`, Object.keys(keepRouteQuery.value).join() || '无');
    } else {
      console.error(`keepRouteQuery: 参数格式错误`);
    }
  }

  return { keepRouteQuery, updateKeepRouteQuery, addKeepRouteQuery };
});

/**
 * 记录各种事件的时间的集合
 */
export const useEventStampsStore = defineStore('eventStamps', () => {
  // Object, 记录各种事件的时间的集合
  const eventStamps = reactive({});

  // 事件时间截集合
  function updateEventStamps(payload) {
    if (typeof payload === 'string') {
      eventStamps[payload] = Date.now();
    } else if (Array.isArray(payload)) {
      // 批量
      const nowTime = Date.now();
      payload.forEach((item) => {
        if (typeof item === 'string') {
          eventStamps[item] = nowTime;
        }
      });
    } else if (isPlainObject(payload)) {
      // 这里可以修改时间截或者设置非时间截的值
      Object.keys(payload).forEach((key) => {
        if (typeof key === 'string') {
          eventStamps[key] = payload[key];
        }
      });
    } else {
      console.warn('eventStamps-参数无效', payload);
    }
  }

  return { eventStamps, updateEventStamps };
});
