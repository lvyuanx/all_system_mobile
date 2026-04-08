import http from '@/utils/request'

const normalizeFilter = (filter) => {
  if (!filter || typeof filter !== 'object') return undefined
  const entries = Object.entries(filter).filter(([_, value]) => value !== undefined && value !== null && value !== '')
  if (entries.length === 0) return undefined
  return JSON.stringify(Object.fromEntries(entries))
}

export const getStaffList = (payload = {}, config = {}) => {
  const { page = 1, page_size = 12, filter = {} } = payload
  const filterValue = normalizeFilter(filter)
  return http.post(
    '/mobile/staff/staff/list/',
    {
      page,
      page_size,
      ...(filterValue ? { filter: filterValue } : {}),
    },
    config,
  )
}

export const getStaffDetail = (userId, config = {}) => {
  return http.get('/mobile/staff/staff/detail/', { user_id: userId }, config)
}

export const activateStaff = (payload, config = {}) => {
  return http.post('/mobile/staff/staff/activate/', payload, config)
}

export const deactivateStaff = (payload, config = {}) => {
  return http.post('/mobile/staff/staff/deactivate/', payload, config)
}

export const updateStaffGroups = (payload, config = {}) => {
  return http.post('/mobile/staff/staff/update_groups/', payload, config)
}

export const getStaffGroupOptions = (config = {}) => {
  return http.get('/mobile/staff/staff/group_options/', {}, config)
}

export const getMobileStaffInfo = (config = {}) => {
  return http.get('/mobile/staff/staff/info/', {}, config)
}
