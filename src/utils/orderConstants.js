export const ORDER_STATUS = {
  CANCELED: 0,
  CREATED: 10,
  CONFIRMED: 20,
  SCHEDULED: 30,
  PRODUCING: 40,
  FINISHED: 50,
  SHIPPED: 60,
  COMPLETED: 70,
}

export const ORDER_STATUS_TABS = [
  { key: 'all', label: '所有订单', statuses: [] },
  { key: 'pool', label: '订单池', statuses: [ORDER_STATUS.CREATED] },
  { key: 'schedule', label: '待排产', statuses: [ORDER_STATUS.CONFIRMED] },
  { key: 'pending-production', label: '待生产', statuses: [ORDER_STATUS.SCHEDULED] },
  { key: 'producing', label: '生产中', statuses: [ORDER_STATUS.PRODUCING] },
  { key: 'pending-ship', label: '待发货', statuses: [ORDER_STATUS.FINISHED] },
  { key: 'pending-sign', label: '待签收', statuses: [ORDER_STATUS.SHIPPED] },
  { key: 'completed', label: '已完成', statuses: [ORDER_STATUS.COMPLETED] },
  { key: 'canceled', label: '已取消', statuses: [ORDER_STATUS.CANCELED] },
]

export const formatMoney = (value) => {
  const num = Number(value)
  if (Number.isNaN(num)) return '0.00'
  return num.toFixed(2)
}

export const toNumber = (value) => {
  const num = Number(value)
  return Number.isNaN(num) ? 0 : num
}
