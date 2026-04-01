import http from '@/utils/request'

export const imageSearch = (file, config = {}) => {
  return http.upload('/mobile/pattern_search/image_search/search/', file, config)
}

export const imageSearchQuota = (config = {}) => {
  return http.get('/mobile/pattern_search/image_search/quota/', {}, config)
}

export const patternSearchByFilename = (filename, config = {}) => {
  return http.get('/mobile/pattern_search/pattern/search/', { filename }, config)
}

export const orderListByPattern = (payload, config = {}) => {
  const { page = 1, page_size = 10, pattern_code = '' } = payload || {}
  return http.post('/mobile/pattern_search/order/list_by_pattern/', {
    page,
    page_size,
    filter: JSON.stringify({ pattern_code }),
  }, config)
}
