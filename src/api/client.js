import http from '@/utils/request'

const normalizeFilter = (filter) => {
  if (!filter || typeof filter !== 'object') return undefined
  const entries = Object.entries(filter).filter(([_, value]) => value !== undefined && value !== null && value !== '')
  if (entries.length === 0) return undefined
  return JSON.stringify(Object.fromEntries(entries))
}

export const getClientList = (payload = {}, config = {}) => {
  const { page = 1, page_size = 10, filter = {} } = payload
  const filterValue = normalizeFilter(filter)
  return http.post(
    '/mobile/client_mgmt/client/list/',
    {
      page,
      page_size,
      ...(filterValue ? { filter: filterValue } : {}),
    },
    config,
  )
}

export const getClientInfo = (clientId, config = {}) => {
  return http.get('/mobile/client_mgmt/client/info/', { client_id: clientId }, config)
}
