import http from '@/utils/request'

export const getPatternList = (payload, config = {}) => {
  return http.post('/mobile/pattern_library/pattern/list/', payload, config)
}

export const getPatternInfo = (patternId, config = {}) => {
  return http.get('/mobile/pattern_library/pattern/info/', { pattern_id: patternId }, config)
}

export const updatePattern = (formData, config = {}) => {
  return http.post('/mobile/pattern_library/pattern/change/', formData, {
    ...config,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const deactivatePattern = (patternId, config = {}) => {
  return http.post('/mobile/pattern_library/pattern/deactivate/', { pattern_id: patternId }, config)
}

export const activatePattern = (patternId, config = {}) => {
  return http.post('/mobile/pattern_library/pattern/activate/', { pattern_id: patternId }, config)
}

export const addPattern = (formData, config = {}) => {
  return http.post('/mobile/pattern_library/pattern/add/', formData, {
    ...config,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
