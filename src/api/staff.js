import http from '@/utils/request'

export const getMobileStaffInfo = (config = {}) => {
  return http.get('/mobile/staff/staff/info/', {}, config)
}
