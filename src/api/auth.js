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

export const getProfile = (config = {}) => {
  return http.get('/mobile/auth/account/profile/', {}, config)
}

export const updateProfile = (payload, config = {}) => {
  return http.post('/mobile/auth/account/profile/update/', payload, config)
}

export const changePassword = (payload, config = {}) => {
  return http.post('/mobile/auth/account/profile/change_password/', payload, config)
}

export const updateAvatar = (formData, config = {}) => {
  return http.post('/mobile/auth/account/profile/avatar/', formData, {
    ...config,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
