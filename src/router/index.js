import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const publicRoutes = new Set(['login', '404'])

const buildMeta = (path, overrides = {}) => {
  const segments = path.split('/').filter(Boolean)
  const index = Math.max(1, segments.length)
  const routeKey = segments[segments.length - 1] || 'home'
  const parentPath = segments.length > 1 ? `/${segments.slice(0, -1).join('/')}` : ''

  return {
    title: '',
    index,
    // Keep compatibility with existing code that still reads meta.level.
    level: index,
    keepAlive: index === 1,
    showTabbar: false,
    showBack: index > 1,
    showNavBar: true,
    routeKey,
    parentPath,
    hierarchy: segments,
    ...overrides,
  }
}

const defineRoute = ({ path, name, title, component, meta }) => ({
  path,
  name,
  component,
  meta: buildMeta(path, { title, ...meta }),
})

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  defineRoute({
    path: '/login',
    name: 'Login',
    title: '登录',
    component: () => import('@/views/login/index.vue'),
    meta: {
      routeKey: 'login',
      showNavBar: false,
      showTabbar: false,
      keepAlive: false,
    },
  }),
  defineRoute({
    path: '/home',
    name: 'Home',
    title: '首页',
    component: () => import('@/views/home/index.vue'),
    meta: {
      showTabbar: true,
      routeKey: 'home',
    },
  }),
  defineRoute({
    path: '/home/detail',
    name: 'HomeDetail',
    title: '详情页',
    component: () => import('@/views/home/detail/index.vue'),
  }),
  defineRoute({
    path: '/home/menu',
    name: 'HomeMenu',
    title: '功能菜单',
    component: () => import('@/views/home/menu/index.vue'),
  }),
  defineRoute({
    path: '/home/order',
    name: 'HomeOrder',
    title: '订单管理',
    component: () => import('@/views/home/order/index.vue'),
    meta: {
      stableKeyByPath: true,
    },
  }),
  defineRoute({
    path: '/home/order/search',
    name: 'HomeOrderSearch',
    title: '订单搜索',
    component: () => import('@/views/home/order/search/index.vue'),
  }),
  defineRoute({
    path: '/home/order/create',
    name: 'HomeOrderCreate',
    title: '新建订单',
    component: () => import('@/views/home/order/create/index.vue'),
  }),
  defineRoute({
    path: '/home/order/detail',
    name: 'HomeOrderDetail',
    title: '订单详情',
    component: () => import('@/views/home/order/detail/index.vue'),
  }),
  defineRoute({
    path: '/home/order/partner-select',
    name: 'HomeOrderPartnerSelect',
    title: '选择收货方',
    component: () => import('@/views/home/order/partner_select/index.vue'),
  }),
  defineRoute({
    path: '/home/order/pattern-select',
    name: 'HomeOrderPatternSelect',
    title: '选择款号',
    component: () => import('@/views/home/order/pattern_select/index.vue'),
  }),
  defineRoute({
    path: '/home/order/pay',
    name: 'HomeOrderPay',
    title: '订单收款',
    component: () => import('@/views/home/order/pay/index.vue'),
  }),
  defineRoute({
    path: '/home/order/ship',
    name: 'HomeOrderShip',
    title: '订单发货',
    component: () => import('@/views/home/order/ship/index.vue'),
  }),
  defineRoute({
    path: '/home/order/timeline',
    name: 'HomeOrderTimeline',
    title: '订单日志',
    component: () => import('@/views/home/order/timeline/index.vue'),
  }),
  defineRoute({
    path: '/home/pattern-library',
    name: 'HomePatternLibrary',
    title: '样板库',
    component: () => import('@/views/home/pattern_library/index.vue'),
  }),
  defineRoute({
    path: '/home/pattern-library/detail',
    name: 'HomePatternLibraryDetail',
    title: '版式详情',
    component: () => import('@/views/home/pattern_library/detail/index.vue'),
  }),
  defineRoute({
    path: '/home/patter-library-add',
    name: 'HomePatterLibraryAdd',
    title: '新增样板',
    component: () => import('@/views/home/patter_library_add/index.vue'),
  }),
  defineRoute({
    path: '/home/patter-library-search',
    name: 'HomePatterLibrarySearch',
    title: '样板库搜索',
    component: () => import('@/views/home/patter_library_search/index.vue'),
  }),
  defineRoute({
    path: '/home/patter-library-search-detail',
    name: 'HomePatterLibrarySearchDetail',
    title: '样板库搜索详情',
    component: () => import('@/views/home/patter_library_search_detail/index.vue'),
  }),
  defineRoute({
    path: '/profile',
    name: 'Profile',
    title: '我的',
    component: () => import('@/views/profile/index.vue'),
    meta: {
      showTabbar: true,
      routeKey: 'profile',
    },
  }),
  defineRoute({
    path: '/profile/settings',
    name: 'ProfileSettings',
    title: '设置',
    component: () => import('@/views/profile/settings/index.vue'),
  }),
  defineRoute({
    path: '/profile/info',
    name: 'ProfileInfo',
    title: '个人信息',
    component: () => import('@/views/profile/info/index.vue'),
  }),
  defineRoute({
    path: '/profile/password',
    name: 'ProfilePassword',
    title: '密码修改',
    component: () => import('@/views/profile/password/index.vue'),
  }),
  defineRoute({
    path: '/profile/avatar',
    name: 'ProfileAvatar',
    title: '修改头像',
    component: () => import('@/views/profile/avatar/index.vue'),
  }),
  defineRoute({
    path: '/404',
    name: 'NotFound',
    title: '404',
    component: () => import('@/views/404/index.vue'),
    meta: {
      routeKey: '404',
      showBack: false,
      showNavBar: false,
      showTabbar: false,
      keepAlive: false,
    },
  }),
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  if (to.query.name) {
    document.title = to.query.name
  } else if (to.meta.title) {
    document.title = to.meta.title
  }

  const userStore = useUserStore()
  const routeKey = to.meta.routeKey
  const isPublicRoute = publicRoutes.has(routeKey)

  if (!userStore.isLoggedIn && !isPublicRoute) {
    next({
      path: '/login',
      query: { redirect: to.fullPath },
    })
    return
  }

  if (userStore.isLoggedIn && routeKey === 'login') {
    next('/home')
    return
  }

  next()
})

export default router

