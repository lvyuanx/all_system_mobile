import { createRouter, createWebHistory } from 'vue-router'

const titleMap = {
  home: '首页',
  category: '分类',
  profile: '我的',
  detail: '详情页',
  settings: '设置',
}

const tabbarRouteNames = new Set(['home', 'category', 'profile'])

const toKebabCase = (value) => {
  return value
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase()
}

const toPascalCase = (value) => {
  return value
    .split(/[-_/]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

const viewModules = import.meta.glob('../views/**/*.vue')

const autoRoutes = Object.entries(viewModules)
  .map(([filePath, component]) => {
    const relativePath = filePath.replace('../views/', '').replace(/\.vue$/, '')
    const segments = relativePath.split('/').filter(Boolean)

    const routeSegments = segments.map((segment) => toKebabCase(segment))
    const lastSegment = routeSegments[routeSegments.length - 1] || 'index'
    const isIndexRoute = lastSegment === 'index'
    const pathSegments = isIndexRoute ? routeSegments.slice(0, -1) : routeSegments

    const path = pathSegments.length ? `/${pathSegments.join('/')}` : '/'
    const routeKey = (pathSegments[pathSegments.length - 1] || 'home').toLowerCase()
    const level = Math.max(1, segments.length)

    return {
      path,
      name: toPascalCase(pathSegments.join('-') || 'Home'),
      component,
      meta: {
        title: titleMap[routeKey] || routeKey,
        level,
        keepAlive: level === 1,
        showTabbar: tabbarRouteNames.has(routeKey) && level === 1,
        showBack: level > 1,
      },
    }
  })
  .filter((route) => route.path !== '/')
  .sort((a, b) => {
    if (a.meta.level !== b.meta.level) {
      return a.meta.level - b.meta.level
    }
    return a.path.localeCompare(b.path)
  })

const defaultRoute = autoRoutes.find((route) => route.meta.level === 1)?.path || autoRoutes[0]?.path || '/home'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: defaultRoute,
    },
    ...autoRoutes,
  ],
})

router.beforeEach((to, _from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title
  }
  next()
})

export default router
