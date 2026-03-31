import http from '@/utils/request'

export const mobileLogin = (payload, config = {}) => {
  return http.post('/mobile/auth/account/login/', payload, config)
}

export const mobileLogout = (config = {}) => {
  return http.post('/mobile/auth/account/logout/', {}, config)
}

export const getMobileMenuList = (parentId = null, config = {}) => {
  const params = parentId !== null ? { parent_id: parentId } : {}
  return http.get('/mobile/auth/menu/list/', params, config)
}
