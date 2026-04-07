<script setup>
defineOptions({ name: 'OrderIndex' })
import { computed, onActivated, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import {
  getOrderList,
  getOrderPayStatusList,
  getOrderShipStatusList,
  getOrderTypeList,
} from '@/api/order'
import { ORDER_STATUS, formatMoney } from '@/utils/orderConstants'
import AppSearchNavBar from '@/components/AppSearchNavBar.vue'
import { useOrderSearchStore } from '@/stores/orderSearch'

const router = useRouter()
const route = useRoute()
const orderSearchStore = useOrderSearchStore()

const search = ref('')

const list = ref([])
const loading = ref(false)
const requesting = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const showFilterPanel = ref(false)
const showDatePicker = ref(false)
const activeDateField = ref('start')
const selectedQuickRange = ref('')
const dateStart = ref(null)
const dateEnd = ref(null)
const orderTypeOptions = ref([])
const payStatusOptions = ref([])
const shipStatusOptions = ref([])
const selectedOrderTypes = ref([])
const selectedPayStatuses = ref([])
const selectedShipStatuses = ref([])
const page = ref(1)
const PAGE_SIZE = 12

const statusFilter = computed(() => {
  const statusRaw = route.query.status
  if (statusRaw !== undefined && statusRaw !== null && statusRaw !== '') {
    const status = Number(statusRaw)
    return Number.isNaN(status) ? null : status
  }
  return null
})

const showCreate = computed(() => statusFilter.value === ORDER_STATUS.CREATED)
const listStatusContext = computed(() => (statusFilter.value === null ? 'all' : String(statusFilter.value)))
const routeKeyword = computed(() => String(route.query.keyword || ''))

const resetList = () => {
  list.value = []
  page.value = 1
  finished.value = false
}

const buildFilter = () => {
  const filter = {}
  const keyword = search.value.trim()
  if (keyword) filter.search = keyword
  if (statusFilter.value !== null) {
    filter.order_status = [statusFilter.value]
  }
  if (dateStart.value) {
    filter.create_time_start = toTimestamp(dateStart.value, false)
  }
  if (dateEnd.value) {
    filter.create_time_end = toTimestamp(dateEnd.value, true)
  }
  if (selectedOrderTypes.value.length) {
    filter.order_type = selectedOrderTypes.value
  }
  if (selectedPayStatuses.value.length) {
    filter.pay_status = selectedPayStatuses.value
  }
  if (selectedShipStatuses.value.length) {
    filter.ship_status = selectedShipStatuses.value
  }
  return filter
}

const loadMore = async (options = {}) => {
  const { silent = false } = options
  if (finished.value) {
    if (!silent) loading.value = false
    return
  }
  if (requesting.value) {
    if (!silent) loading.value = false
    return
  }
  requesting.value = true
  if (!silent) loading.value = true
  try {
    const res = await getOrderList(
      {
        page: page.value,
        page_size: PAGE_SIZE,
        filter: buildFilter(),
      },
      { loading: false },
    )
    const data = res?.data || {}
    const items = data.items || []
    const hasTotal = data.total_count !== undefined && data.total_count !== null
    const total = hasTotal ? Number(data.total_count) : 0
    if (page.value === 1) {
      list.value = []
    }
    list.value.push(...items)
    if (hasTotal) {
      finished.value = list.value.length >= (Number.isNaN(total) ? 0 : total)
    } else {
      finished.value = items.length < PAGE_SIZE
    }
    if (!finished.value) page.value += 1
  } catch {
    showToast('订单加载失败')
  } finally {
    requesting.value = false
    if (!silent) loading.value = false
  }
}

watch(
  () => [route.query.status, route.query.keyword],
  () => {
    search.value = routeKeyword.value
    resetList()
    loadMore()
  },
)

const goSearchPage = () => {
  router.push({
    path: '/home/order/search',
    query: search.value ? { keyword: search.value } : {},
  })
}

const onClear = async () => {
  search.value = ''
  // 使用 router.replace 保持 vue-router 状态一致，避免返回后恢复旧关键词
  if (route.query.keyword !== undefined) {
    const { keyword: _keyword, ...restQuery } = route.query
    await router.replace({
      path: route.path,
      query: restQuery,
    })
    return
  }

  resetList()
  loadMore()
}

const consumePendingKeyword = () => {
  const pending = orderSearchStore.takePendingKeyword()
  if (pending === null) return false

  search.value = pending
  resetList()
  loadMore()
  return true
}

const toTimestamp = (date, isEnd) => {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return null
  if (isEnd) {
    d.setHours(23, 59, 59, 999)
  } else {
    d.setHours(0, 0, 0, 0)
  }
  return Math.floor(d.getTime() / 1000)
}

const openDatePicker = (field) => {
  selectedQuickRange.value = ''
  activeDateField.value = field
  showDatePicker.value = true
}

const onConfirmDate = (value) => {
  if (activeDateField.value === 'start') {
    dateStart.value = value
    if (dateEnd.value && value > dateEnd.value) {
      dateEnd.value = value
    }
  } else {
    dateEnd.value = value
    if (dateStart.value && value < dateStart.value) {
      dateStart.value = value
    }
  }
  showDatePicker.value = false
}

const clearFilters = () => {
  selectedQuickRange.value = ''
  dateStart.value = null
  dateEnd.value = null
  selectedOrderTypes.value = []
  selectedPayStatuses.value = []
  selectedShipStatuses.value = []
}

const applyFilters = () => {
  showFilterPanel.value = false
  resetList()
  loadMore()
}

const toggleOrderType = (value) => {
  const index = selectedOrderTypes.value.indexOf(value)
  if (index >= 0) {
    selectedOrderTypes.value.splice(index, 1)
  } else {
    selectedOrderTypes.value.push(value)
  }
}

const togglePayStatus = (value) => {
  const index = selectedPayStatuses.value.indexOf(value)
  if (index >= 0) {
    selectedPayStatuses.value.splice(index, 1)
  } else {
    selectedPayStatuses.value.push(value)
  }
}

const toggleShipStatus = (value) => {
  const index = selectedShipStatuses.value.indexOf(value)
  if (index >= 0) {
    selectedShipStatuses.value.splice(index, 1)
  } else {
    selectedShipStatuses.value.push(value)
  }
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const startDateText = computed(() => (dateStart.value ? formatDate(dateStart.value) : '选择起始时间'))
const endDateText = computed(() => (dateEnd.value ? formatDate(dateEnd.value) : '选择终止时间'))

const currentYear = new Date().getFullYear()
const quickRanges = computed(() => [
  { key: 'last_month', label: '近一个月', months: 1 },
  { key: 'this_year', label: String(currentYear), year: currentYear },
  { key: 'last_year', label: String(currentYear - 1), year: currentYear - 1 },
])

const applyQuickRange = (range) => {
  selectedQuickRange.value = range.key
  const now = new Date()
  if (range.months) {
    dateEnd.value = now
    const start = new Date(now)
    start.setMonth(start.getMonth() - range.months)
    dateStart.value = start
    return
  }
  if (range.year) {
    dateStart.value = new Date(range.year, 0, 1)
    dateEnd.value = new Date(range.year, 11, 31, 23, 59, 59)
  }
}

const onRefresh = async () => {
  refreshing.value = true
  resetList()
  try {
    await loadMore({ silent: true })
  } finally {
    refreshing.value = false
  }
}

const goDetail = (order) => {
  router.push({
    path: '/home/order/detail',
    query: { id: order.order_id, name: '订单详情', list_status: listStatusContext.value, order_status: order.order_status },
  })
}

const goCreate = () => {
  router.push({ path: '/home/order/create', query: { name: '新建订单' } })
}

const onNavBack = () => {
  const hasBack = Boolean(window.history.state?.back)
  if (hasBack) {
    router.back()
    return
  }
  router.replace('/home')
}

const onCardAction = (action, order) => {
  if (action === 'pay') {
    router.push({
      path: '/home/order/pay',
      query: { id: order.order_id, name: '订单收款', list_status: listStatusContext.value },
    })
    return
  }
  if (action === 'detail') {
    goDetail(order)
    return
  }
  if (action === 'contact') {
    showToast('联系客户功能开发中')
    return
  }
}

const fetchOrderTypes = async () => {
  try {
    const res = await getOrderTypeList({ loading: false })
    const list = Array.isArray(res?.data) ? res.data : []
    orderTypeOptions.value = list.map((item) => ({
      label: item.label || item.name,
      value: Number(item.value),
    }))
    if (orderTypeOptions.value.length) return
  } catch {
    // ignore, use fallback below
  }

  orderTypeOptions.value = [
    { label: '客户订单', value: 1 },
    { label: '同行转单', value: 2 },
  ]
}

const fetchPayStatusOptions = async () => {
  try {
    const res = await getOrderPayStatusList({ loading: false })
    const list = Array.isArray(res?.data) ? res.data : []
    payStatusOptions.value = list.map((item) => ({
      label: item.label || item.name,
      value: Number(item.value),
    }))
    if (payStatusOptions.value.length) return
  } catch {
    // ignore, use fallback below
  }

  payStatusOptions.value = [
    { label: '未支付', value: 1 },
    { label: '部分支付', value: 2 },
    { label: '全部支付', value: 99 },
  ]
}

const fetchShipStatusOptions = async () => {
  try {
    const res = await getOrderShipStatusList({ loading: false })
    const list = Array.isArray(res?.data) ? res.data : []
    shipStatusOptions.value = list.map((item) => ({
      label: item.label || item.name,
      value: Number(item.value),
    }))
    if (shipStatusOptions.value.length) return
  } catch {
    // ignore, use fallback below
  }

  shipStatusOptions.value = [
    { label: '未发货', value: 1 },
    { label: '部分发货', value: 2 },
    { label: '全部发货', value: 99 },
  ]
}

const statusClass = (status) => {
  switch (Number(status)) {
    case ORDER_STATUS.CREATED:
      return 'status-created'
    case ORDER_STATUS.CONFIRMED:
      return 'status-confirmed'
    case ORDER_STATUS.SCHEDULED:
      return 'status-scheduled'
    case ORDER_STATUS.PRODUCING:
      return 'status-producing'
    case ORDER_STATUS.FINISHED:
      return 'status-finished'
    case ORDER_STATUS.SHIPPED:
      return 'status-shipped'
    case ORDER_STATUS.COMPLETED:
      return 'status-completed'
    case ORDER_STATUS.CANCELED:
      return 'status-canceled'
    default:
      return ''
  }
}

const cardTitle = (order) => {
  return order.receiver_company || `订单 ${order.order_no || ''}`
}


const primaryActionText = (status) => {
  switch (Number(status)) {
    case ORDER_STATUS.CREATED:
      return '去收款'
    case ORDER_STATUS.CONFIRMED:
      return '去排产'
    case ORDER_STATUS.SCHEDULED:
    case ORDER_STATUS.PRODUCING:
      return '去发货'
    case ORDER_STATUS.FINISHED:
      return '去完工'
    case ORDER_STATUS.SHIPPED:
      return '查看物流'
    case ORDER_STATUS.COMPLETED:
      return '再次下单'
    default:
      return '查看详情'
  }
}

onMounted(() => {
  if (consumePendingKeyword()) {
    fetchOrderTypes()
    fetchPayStatusOptions()
    fetchShipStatusOptions()
    return
  }
  search.value = routeKeyword.value
  fetchOrderTypes()
  fetchPayStatusOptions()
  fetchShipStatusOptions()
  loadMore()
})

onActivated(() => {
  consumePendingKeyword()
})
</script>

<template>
  <div class="page">
    <div class="search-wrap">
      <AppSearchNavBar
        v-model="search"
        placeholder="搜索订单号 / 收货人 / 电话"
        :show-back="true"
        :readonly="true"
        @click-left="onNavBack"
        @clear="onClear"
        @click-input="goSearchPage"
      >
        <template #right>
          <button type="button" class="nav-action" @click="showFilterPanel = true">
            <van-icon name="filter-o" size="16" />
            <span>筛选</span>
          </button>
          <button v-if="showCreate" type="button" class="nav-action" @click="goCreate">
            <van-icon name="plus" size="16" />
            <span>新建</span>
          </button>
        </template>
      </AppSearchNavBar>
    </div>

    <van-popup
      v-model:show="showFilterPanel"
      position="top"
      round
      class="filter-popup"
    >
      <div class="filter-section">
        <div class="filter-title">按时间选择</div>
        <div class="chip-grid">
          <button
            v-for="item in quickRanges"
            :key="item.label"
            type="button"
            class="filter-chip-btn"
            :class="{ active: selectedQuickRange === item.key }"
            @click="applyQuickRange(item)"
          >
            {{ item.label }}
          </button>
        </div>
        <div class="date-grid">
          <button type="button" class="date-btn" @click="openDatePicker('start')">{{ startDateText }}</button>
          <span class="date-sep">—</span>
          <button type="button" class="date-btn" @click="openDatePicker('end')">{{ endDateText }}</button>
        </div>
      </div>

      <div class="filter-section">
        <div class="filter-title">按服务选择</div>
        <div class="chip-grid">
          <button
            v-for="item in orderTypeOptions"
            :key="item.value"
            type="button"
            class="filter-chip-btn"
            :class="{ active: selectedOrderTypes.includes(item.value) }"
            @click="toggleOrderType(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div class="filter-section">
        <div class="filter-title">按支付状态</div>
        <div class="chip-grid">
          <button
            v-for="item in payStatusOptions"
            :key="item.value"
            type="button"
            class="filter-chip-btn"
            :class="{ active: selectedPayStatuses.includes(item.value) }"
            @click="togglePayStatus(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div class="filter-section">
        <div class="filter-title">按发货状态</div>
        <div class="chip-grid">
          <button
            v-for="item in shipStatusOptions"
            :key="item.value"
            type="button"
            class="filter-chip-btn"
            :class="{ active: selectedShipStatuses.includes(item.value) }"
            @click="toggleShipStatus(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div class="filter-actions">
        <button type="button" class="panel-btn panel-btn-ghost" @click="clearFilters">清空</button>
        <button type="button" class="panel-btn panel-btn-primary" @click="applyFilters">确定</button>
      </div>
    </van-popup>

    <van-pull-refresh v-model="refreshing" class="refresh-wrap" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadMore"
        class="list"
      >
        <div
          v-for="order in list"
          :key="order.order_id"
          class="order-card"
          @click="goDetail(order)"
        >
          <div class="card-top">
            <div class="shop-line">
              <span class="shop-name text-ellipsis">{{ cardTitle(order) }}</span>
              <van-icon name="arrow" size="11" class="shop-arrow" />
            </div>
            <span class="top-status" :class="statusClass(order.order_status)">{{ order.order_status_str || '-' }}</span>
          </div>

          <div class="card-main">
            <div class="thumb-list">
              <template v-if="order.main_images?.length">
                <img
                  v-for="(img, i) in order.main_images.slice(0, 4)"
                  :key="i"
                  :src="img"
                  class="thumb-image"
                />
              </template>
              <div v-else class="thumb-placeholder">
                <van-icon name="photo-o" size="20" color="#d1d5db" />
              </div>
            </div>
            <div class="price-wrap">
              <div class="amount">￥{{ formatMoney(order.payable_amount) }}</div>
            </div>
          </div>

          <div class="card-footer">
            <span class="card-time">{{ order.create_time_str || '-' }}</span>
            <div class="card-actions">
              <button type="button" class="action-btn" @click.stop="onCardAction('contact', order)">联系客户</button>
              <button type="button" class="action-btn action-btn-primary" @click.stop="onCardAction('pay', order)">
                {{ primaryActionText(order.order_status) }}
              </button>
            </div>
          </div>
        </div>

        <template v-if="!loading && list.length === 0" #finished>
          <div class="empty-wrap">
            <van-empty description="暂无订单" />
          </div>
        </template>
      </van-list>
    </van-pull-refresh>
    <van-calendar
      v-model:show="showDatePicker"
      type="single"
      color="#2563eb"
      @confirm="onConfirmDate"
    />
  </div>
</template>

<style scoped>
.page {
  min-height: 100%;
  background: var(--color-background);
}

.search-wrap {
  position: sticky;
  top: 0;
  z-index: 12;
  background: var(--color-background);
}

.nav-action {
  border: none;
  background: transparent;
  color: #475569;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  font-size: 10px;
  padding: 0;
  min-width: 32px;
  height: 34px;
  cursor: pointer;
}

.nav-action-primary {
  color: #2563eb;
}

.filter-popup {
  background: var(--color-background);
  padding: 10px 12px 14px;
}

.filter-section + .filter-section {
  margin-top: 12px;
}

.filter-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 10px;
}

.chip-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.filter-chip-btn {
  border: 0;
  background: #ffffff;
  color: #374151;
  height: 36px;
  border-radius: 18px;
  font-size: 13px;
}

.filter-chip-btn.active {
  background: color-mix(in srgb, var(--color-primary) 16%, #ffffff);
  color: var(--color-primary);
}

.date-grid {
  margin-top: 8px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 8px;
  align-items: center;
}

.date-btn {
  border: 0;
  background: #ffffff;
  color: #6b7280;
  height: 36px;
  border-radius: 18px;
  font-size: 13px;
}

.date-sep {
  color: #9ca3af;
}

.filter-actions {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.panel-btn {
  border: 0;
  height: 42px;
  border-radius: 22px;
  font-size: 18px;
  font-weight: 600;
}

.panel-btn-ghost {
  background: color-mix(in srgb, var(--color-primary) 10%, #ffffff);
  color: var(--color-primary);
}

.panel-btn-primary {
  background: var(--color-primary);
  color: #ffffff;
}

.list {
  padding: 8px 10px 20px;
  min-height: calc(100dvh - 132px);
  display: flex;
  flex-direction: column;
}

.empty-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.order-card {
  background: #fff;
  border-radius: 12px;
  padding: 12px 12px 10px;
  margin-bottom: 8px;
  border: 1px solid #eef0f4;
  cursor: pointer;
  transition: transform 0.15s ease;
  overflow: hidden;
}

.order-card:active {
  transform: scale(0.985);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f3f4f6;
}

.shop-line {
  min-width: 0;
  flex: 1;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.shop-arrow {
  color: #c4c9d4;
  flex-shrink: 0;
}

.top-status {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid currentColor;
}

.card-main {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}

.thumb-list {
  display: flex;
  gap: 5px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.thumb-image {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
  background: #f3f4f6;
  display: block;
}

.thumb-placeholder {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
}

.price-wrap {
  flex-shrink: 0;
  text-align: right;
  align-self: flex-end;
}

.amount {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
}

.card-time {
  font-size: 12px;
  color: #9ca3af;
}

.card-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.action-btn {
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #4b5563;
  font-size: 12px;
  border-radius: 999px;
  height: 28px;
  padding: 0 12px;
  cursor: pointer;
}

.action-btn-primary {
  border-color: #fdba74;
  color: #ea580c;
  background: #fff7ed;
}

/* 状态标签颜色 */
.top-status.status-created   { color: #2563eb; background: #eff6ff; border-color: #bfdbfe; }
.top-status.status-confirmed { color: #7c3aed; background: #f5f3ff; border-color: #ddd6fe; }
.top-status.status-scheduled { color: #0284c7; background: #f0f9ff; border-color: #bae6fd; }
.top-status.status-producing { color: #d97706; background: #fffbeb; border-color: #fde68a; }
.top-status.status-finished  { color: #059669; background: #ecfdf5; border-color: #a7f3d0; }
.top-status.status-shipped   { color: #0f766e; background: #f0fdfa; border-color: #99f6e4; }
.top-status.status-completed { color: #374151; background: #f9fafb; border-color: #d1d5db; }
.top-status.status-canceled  { color: #9ca3af; background: #f9fafb; border-color: #e5e7eb; }

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 360px) {
  .thumb-image {
    width: 56px;
    height: 56px;
  }

  .action-btn {
    padding: 0 10px;
  }
}
</style>
