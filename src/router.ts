import { createRouter, createWebHistory } from 'vue-router';
import Home from './components/Home.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: Home,
    },
    {
      path: '/2048',
      component: () => import('@/2048/vue').then(m => m.default),
    },
    {
      path: '/minesweeper',
      component: () => import('@/minesweeper/vue').then(m => m.default),
    },
    {
      path: '/n-queens',
      component: () => import('@/n-queens/vue').then(m => m.default),
    },
    {
      path: '/sliding-puzzle',
      component: () => import('@/sliding-puzzle/vue').then(m => m.default),
    },
  ],
});
