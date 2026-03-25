import { createRouter, createWebHistory } from 'vue-router'

import Home from '@/views/Home.vue'
import Category from '@/views/Category.vue'
import Profile from '@/views/Profile.vue'
import Detail from '@/views/Detail.vue'
import Settings from '@/views/Settings.vue'

const routes = [
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: {
      title: '首页',
      keepAlive: true,
      level: 1,
      showTabbar: true,
      showBack: false,
    },
  },
  {
    path: '/category',
    name: 'Category',
    component: Category,
    meta: {
      title: '分类',
      keepAlive: true,
      level: 1,
      showTabbar: true,
      showBack: false,
    },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: {
      title: '我的',
      keepAlive: true,
      level: 1,
      showTabbar: true,
      showBack: false,
    },
  },
  {
    path: '/detail',
    name: 'Detail',
    component: Detail,
    meta: {
      title: '详情页',
      level: 2,
      showTabbar: false,
      showBack: true,
    },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: {
      title: '设置',
      level: 2,
      showTabbar: false,
      showBack: true,
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title
  }
  next()
})

export default router
