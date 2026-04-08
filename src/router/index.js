import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const publicRoutes = new Set(['login', '404'])

const buildMeta = (path, overrides = {}) => {
  const segments = path.split('/').filter(Boolean)
  const rawIndex = Number(overrides.index ?? 1)
  const index = Number.isFinite(rawIndex) ? Math.max(1, Math.trunc(rawIndex)) : 1
  const level = String(Math.trunc(index)).length
  const routeKey = segments[segments.length - 1] || 'home'
  const parentPath = segments.length > 1 ? `/${segments.slice(0, -1).join('/')}` : ''

  return {
    title: '',
    index,
    // Keep compatibility with existing code that still reads meta.level.
    level,
    keepAlive: level === 1,
    showTabbar: false,
    showBack: level > 1,
    showNavBar: true,
    navBarBackground: 'var(--color-background)',
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
      index: 1,
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
      index: 1,
      showTabbar: true,
      routeKey: 'home',
    },
  }),
  defineRoute({
    path: '/home/detail',
    name: 'HomeDetail',
    title: '详情页',
    component: () => import('@/views/home/detail/index.vue'),
    meta: {
      index: 11,
    },
  }),
  defineRoute({
    path: '/home/menu',
    name: 'HomeMenu',
    title: '功能菜单',
    component: () => import('@/views/home/menu/index.vue'),
    meta: {
      index: 11,
    },
  }),
  defineRoute({
    path: '/home/order',
    name: 'HomeOrder',
    title: '订单管理',
    component: () => import('@/views/home/order/index.vue'),
    meta: {
      index: 11,
      stableKeyByPath: true,
      showNavBar: false,
      navBarBackground: '#f2f3f7',
    },
  }),
  defineRoute({
    path: '/home/order/search',
    name: 'HomeOrderSearch',
    title: '订单搜索',
    component: () => import('@/views/home/order/search/index.vue'),
    meta: {
      index: 111,
      navBarBackground: '#f2f3f7',
    },
  }),
  defineRoute({
    path: '/home/order/create',
    name: 'HomeOrderCreate',
    title: '新建订单',
    component: () => import('@/views/home/order/create/index.vue'),
    meta: {
      index: 111,
      navBarBackground: '#f2f3f7',
    },
  }),
  defineRoute({
    path: '/home/order/detail',
    name: 'HomeOrderDetail',
    title: '订单详情',
    component: () => import('@/views/home/order/detail/index.vue'),
    meta: {
      index: 111,
      showNavBar: false,
      navBarBackground: '#f4f6fb',
    },
  }),
  defineRoute({
    path: '/home/order/partner-select',
    name: 'HomeOrderPartnerSelect',
    title: '选择收货方',
    component: () => import('@/views/home/order/partner_select/index.vue'),
    meta: {
      index: 111,
      navBarBackground: '#f4f6fb',
    },
  }),
  defineRoute({
    path: '/home/order/pattern-select',
    name: 'HomeOrderPatternSelect',
    title: '选择款号',
    component: () => import('@/views/home/order/pattern_select/index.vue'),
    meta: {
      index: 111,
      navBarBackground: '#f4f6fb',
    },
  }),
  defineRoute({
    path: '/home/order/pay',
    name: 'HomeOrderPay',
    title: '订单收款',
    component: () => import('@/views/home/order/pay/index.vue'),
    meta: {
      index: 111,
      showNavBar: false,
    },
  }),
  defineRoute({
    path: '/home/order/ship',
    name: 'HomeOrderShip',
    title: '订单发货',
    component: () => import('@/views/home/order/ship/index.vue'),
    meta: {
      index: 111,
      navBarBackground: '#f4f6fb',
    },
  }),
  defineRoute({
    path: '/home/order/timeline',
    name: 'HomeOrderTimeline',
    title: '订单日志',
    component: () => import('@/views/home/order/timeline/index.vue'),
    meta: {
      index: 111,
      navBarBackground: '#f4f6fb',
    },
  }),
  defineRoute({
    path: '/home/client',
    name: 'HomeClient',
    title: '客户管理',
    component: () => import('@/views/home/client/index.vue'),
    meta: {
      index: 11,
      showNavBar: false,
      navBarBackground: '#f2f3f7',
      keepAlive: true,
    },
  }),
  defineRoute({
    path: '/home/client/search',
    name: 'HomeClientSearch',
    title: '客户搜索',
    component: () => import('@/views/home/client/search/index.vue'),
    meta: {
      index: 111,
      navBarBackground: '#f2f3f7',
    },
  }),
  defineRoute({
    path: '/home/client/detail',
    name: 'HomeClientDetail',
    title: '客户详情',
    component: () => import('@/views/home/client/detail/index.vue'),
    meta: {
      index: 111,
      showNavBar: false,
      navBarBackground: '#f4f6fb',
    },
  }),
  defineRoute({
    path: '/home/pattern-library',
    name: 'HomePatternLibrary',
    title: '样板库',
    component: () => import('@/views/home/pattern_library/index.vue'),
    meta: {
      index: 11,
    },
  }),
  defineRoute({
    path: '/home/pattern-library/detail',
    name: 'HomePatternLibraryDetail',
    title: '版式详情',
    component: () => import('@/views/home/pattern_library/detail/index.vue'),
    meta: {
      index: 111,
      showNavBar: false,
    },
  }),
  defineRoute({
    path: '/home/patter-library-add',
    name: 'HomePatterLibraryAdd',
    title: '新增样板',
    component: () => import('@/views/home/patter_library_add/index.vue'),
    meta: {
      index: 11,
    },
  }),
  defineRoute({
    path: '/home/patter-library-search',
    name: 'HomePatterLibrarySearch',
    title: '样板库搜索',
    component: () => import('@/views/home/patter_library_search/index.vue'),
    meta: {
      index: 11,
      showNavBar: false,
      navBarBackground: '#f4f6fb',
    },
  }),
  defineRoute({
    path: '/home/patter-library-search-detail',
    name: 'HomePatterLibrarySearchDetail',
    title: '样板库搜索详情',
    component: () => import('@/views/home/patter_library_search_detail/index.vue'),
    meta: {
      index: 11,
      showNavBar: false,
    },
  }),
  defineRoute({
    path: '/profile',
    name: 'Profile',
    title: '我的',
    component: () => import('@/views/profile/index.vue'),
    meta: {
      index: 1,
      showTabbar: true,
      routeKey: 'profile',
    },
  }),
  defineRoute({
    path: '/profile/settings',
    name: 'ProfileSettings',
    title: '设置',
    component: () => import('@/views/profile/settings/index.vue'),
    meta: {
      index: 11,
    },
  }),
  defineRoute({
    path: '/profile/info',
    name: 'ProfileInfo',
    title: '个人信息',
    component: () => import('@/views/profile/info/index.vue'),
    meta: {
      index: 11,
    },
  }),
  defineRoute({
    path: '/profile/password',
    name: 'ProfilePassword',
    title: '密码修改',
    component: () => import('@/views/profile/password/index.vue'),
    meta: {
      index: 11,
      navBarBackground: '#f3f4f6',
    },
  }),
  defineRoute({
    path: '/profile/avatar',
    name: 'ProfileAvatar',
    title: '修改头像',
    component: () => import('@/views/profile/avatar/index.vue'),
    meta: {
      index: 11,
    },
  }),
  defineRoute({
    path: '/404',
    name: 'NotFound',
    title: '404',
    component: () => import('@/views/404/index.vue'),
    meta: {
      index: 1,
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
