import http from '@/utils/request'

export const getCurSiteOptions = (config = {}) => {
  return http.get('/mobile/site_mgmt/site/site_options/', {}, config)
}
