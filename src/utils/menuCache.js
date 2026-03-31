import { getMobileMenuList } from '@/api/auth'

// 全局菜单缓存，HomeIndex 和 HomeMenu 共享
export const menuCache = new Map()

const normalizeItems = (data) =>
  (data || []).map((item) => ({
    id: item.id,
    icon: item.icon || 'apps-o',
    text: item.name,
    url: item.url,
    hasChildren: item.has_children,
  }))

export const fetchMenus = async (parentId) => {
  const key = parentId ?? 'root'
  if (menuCache.has(key)) return menuCache.get(key)

  const res = await getMobileMenuList(parentId, { loading: false })
  const data = normalizeItems(res?.data)
  menuCache.set(key, data)
  return data
}

// 后台预加载：加载 parentId 的子菜单，再递归预加载每个子项的下一级
export const preloadMenus = (parentId) => {
  const key = parentId ?? 'root'
  if (menuCache.has(key)) {
    // 已缓存，继续预加载其子项
    const items = menuCache.get(key)
    items.forEach((item) => {
      if (!item.url && !menuCache.has(item.id)) {
        preloadMenus(item.id)
      }
    })
    return
  }

  getMobileMenuList(parentId, { loading: false })
    .then((res) => {
      const data = normalizeItems(res?.data)
      menuCache.set(key, data)
      // 递归预加载子项的下一级
      data.forEach((item) => {
        if (!item.url && !menuCache.has(item.id)) {
          preloadMenus(item.id)
        }
      })
    })
    .catch(() => {})
}
