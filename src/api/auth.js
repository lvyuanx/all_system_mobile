import http from '@/utils/request'

const baseURL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
const hasApiPrefix = /\/api$/i.test(baseURL)
const MOBILE_LOGIN_URL = hasApiPrefix
  ? '/mobile/auth/account/login/'
  : '/api/mobile/auth/account/login/'

export const mobileLogin = (payload, config = {}) => {
  return http.post(MOBILE_LOGIN_URL, payload, config)
}

const MOBILE_LOGOUT_URL = hasApiPrefix
  ? '/mobile/auth/account/logout/'
  : '/api/mobile/auth/account/logout/'

export const mobileLogout = (config = {}) => {
  return http.post(MOBILE_LOGOUT_URL, {}, config)
}
