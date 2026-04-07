import http from '@/utils/request'

const normalizeFilter = (filter) => {
  if (!filter || typeof filter !== 'object') return undefined
  const entries = Object.entries(filter).filter(([_, value]) => value !== undefined && value !== null && value !== '')
  if (entries.length === 0) return undefined
  return JSON.stringify(Object.fromEntries(entries))
}

export const getOrderList = (payload = {}, config = {}) => {
  const { page = 1, page_size = 10, filter = {} } = payload
  const filterValue = normalizeFilter(filter)
  return http.post(
    '/mobile/order/order/list/',
    {
      page,
      page_size,
      ...(filterValue ? { filter: filterValue } : {}),
    },
    config,
  )
}

export const getOrderInfo = (orderId, config = {}) => {
  return http.get('/mobile/order/order/info/', { order_id: orderId }, config)
}

export const createOrder = (payload, config = {}) => {
  return http.post('/mobile/order/order/create/', payload, config)
}

export const cancelOrder = (payload, config = {}) => {
  return http.post('/mobile/order/order/cancel/', payload, config)
}

export const confirmOrder = (payload, config = {}) => {
  return http.post('/mobile/order/order/confirm/', payload, config)
}

export const scheduleOrder = (payload, config = {}) => {
  return http.post('/mobile/order/order/schedule/', payload, config)
}

export const startProduction = (payload, config = {}) => {
  return http.post('/mobile/order/order/start_production/', payload, config)
}

export const finishProduction = (payload, config = {}) => {
  return http.post('/mobile/order/order/finish_production/', payload, config)
}

export const completeOrder = (payload, config = {}) => {
  return http.post('/mobile/order/order/complete/', payload, config)
}

export const shipOrder = (payload, config = {}) => {
  return http.put('/mobile/order/order/ship/', payload, config)
}

export const payOrder = (payload, config = {}) => {
  return http.post('/mobile/order/order/pay/', payload, config)
}

export const getOrderStatusFlow = (config = {}) => {
  return http.get('/mobile/order/meta/status_flow/', {}, config)
}

export const getOrderTimeline = (orderId, config = {}) => {
  return http.get('/mobile/order/order/timeline/', { order_id: orderId }, config)
}

export const getOrderTypeList = (config = {}) => {
  return http.get('/mobile/order/meta/order_type_all_list/', {}, config)
}

export const getDeliveryList = (config = {}) => {
  return http.get('/mobile/order/meta/delivery_all_list/', {}, config)
}

export const getPayMethodTypeList = (config = {}) => {
  return http.get('/mobile/order/pay/pay_method_type_all_list/', {}, config)
}

export const getOrderPayStatusList = (config = {}) => {
  return http.get('/mobile/order/meta/pay_status_all_list/', {}, config)
}

export const getOrderShipStatusList = (config = {}) => {
  return http.get('/mobile/order/meta/ship_status_all_list/', {}, config)
}

export const getOrderPayCaList = (orderId, config = {}) => {
  return http.get('/mobile/order/pay/ca_list/', { oid: orderId }, config)
}

export const getOrderReceiverOptions = (config = {}) => {
  return http.get('/mobile/order/meta/receiver_options/', {}, config)
}

export const getSiteAddressList = (payload = {}, config = {}) => {
  const { page = 1, page_size = 10, filter = {} } = payload || {}
  return http.post(
    '/mobile/site_mgmt/site/site_address_list/',
    {
      page,
      page_size,
      filter: JSON.stringify(filter || {}),
    },
    config,
  )
}

export const getClientAddressList = (payload = {}, config = {}) => {
  const { page = 1, page_size = 10, filter = {} } = payload || {}
  return http.post(
    '/mobile/client_mgmt/client/client_address_list/',
    {
      page,
      page_size,
      filter: JSON.stringify(filter || {}),
    },
    config,
  )
}
