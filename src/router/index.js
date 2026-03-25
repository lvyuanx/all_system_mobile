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

const toTitle = (segment) => {
  if (!segment) return '页面'
  const kebab = toKebabCase(segment)
  return titleMap[kebab] || kebab
}

const viewModules = import.meta.glob('../views/**/index.vue')

const autoRoutes = Object.entries(viewModules)
  .map(([filePath, component]) => {
    const relativePath = filePath.replace('../views/', '').replace(/\/index\.vue$/, '')
    const pathSegments = relativePath
      .split('/')
      .filter(Boolean)
      .map((segment) => toKebabCase(segment))

    const path = `/${pathSegments.join('/')}`
    const routeKey = pathSegments[pathSegments.length - 1] || 'home'
    const level = Math.max(1, pathSegments.length)
    const parentSegments = pathSegments.slice(0, -1)
    const parentPath = parentSegments.length ? `/${parentSegments.join('/')}` : ''

    return {
      path,
      name: toPascalCase(pathSegments.join('-')),
      component,
      meta: {
        title: toTitle(routeKey),
        level,
        keepAlive: level === 1,
        showTabbar: tabbarRouteNames.has(routeKey) && level === 1,
        showBack: level > 1,
        routeKey,
        parentPath,
        hierarchy: pathSegments,
      },
    }
  })
  .sort((a, b) => {
    if (a.meta.level !== b.meta.level) {
      return a.meta.level - b.meta.level
    }
    return a.path.localeCompare(b.path)
  })

const defaultRoute = autoRoutes.find((route) => route.meta.level === 1)?.path || '/home'

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
