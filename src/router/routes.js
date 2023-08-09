import ViewsRoot from '@/views/ViewsRoot.vue';

export default [
  {
    path: '',
    component: ViewsRoot,
    children: [
      {
        path: '',
        redirect: '/home',
      },
      {
        path: '/home',
        name: 'home',
        component: () => import('@/views/HomeView.vue'),
      },
      {
        path: '/about',
        name: 'about',
        // route level code-splitting
        // this generates a separate chunk (About.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import('@/views/AboutView.vue'),
      },
      {
        path: '/demo',
        component: () => import('@/views/demo/index.vue'),
        children: [
          {
            path: 'page1',
            name: 'demoPage1',
            component: () => import('@/views/demo/page1.vue'),
            meta: { title: 'demo-page-1' },
          },
          {
            path: 'page2',
            name: 'demoPage2',
            component: () => import('@/views/demo/page2.vue'),
          },
        ],
      },
      ...[1, 2, 3, 4, 5, 6].map((num) => ({
        path: `/page-demo${num}`,
        name: `page-demo-${String(num).repeat(3)}`,
        component: () => import(`@/views/page-demo/page${num}.vue`),
      })),
    ],
  },
];
