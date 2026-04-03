<script setup>
defineOptions({ name: 'OrderIndex' })
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getOrderList } from '@/api/order'
import { ORDER_STATUS, formatMoney } from '@/utils/orderConstants'

const router = useRouter()
const route = useRoute()

const search = ref('')

const list = ref([])
const loading = ref(false)
const requesting = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const showCalendar = ref(false)
const dateRange = ref(null)
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
  if (dateRange.value?.length === 2) {
    filter.create_time_start = toTimestamp(dateRange.value[0], false)
    filter.create_time_end = toTimestamp(dateRange.value[1], true)
  }
  return filter
}

const loadMore = async () => {
  if (finished.value) {
    loading.value = false
    return
  }
  if (requesting.value) {
    loading.value = false
    return
  }
  requesting.value = true
  loading.value = true
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
    loading.value = false
  }
}

watch(
  () => route.query.status,
  () => {
    resetList()
    loadMore()
  },
)

const onSearch = () => {
  resetList()
  loadMore()
}

const onClear = () => {
  search.value = ''
  resetList()
  loadMore()
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
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

const dateRangeText = computed(() => {
  if (!dateRange.value?.length) return ''
  const [start, end] = dateRange.value
  return `${formatDate(start)} ~ ${formatDate(end)}`
})

const onConfirmRange = (value) => {
  let start = null
  let end = null
  if (Array.isArray(value)) {
    ;[start, end] = value
  } else if (value?.start && value?.end) {
    start = value.start
    end = value.end
  }
  if (start && end) {
    dateRange.value = [start, end]
  }
  showCalendar.value = false
  resetList()
  loadMore()
}

const clearDateRange = () => {
  dateRange.value = null
  resetList()
  loadMore()
}

const onRefresh = async () => {
  refreshing.value = true
  resetList()
  try {
    await loadMore()
  } finally {
    refreshing.value = false
  }
}

const goDetail = (order) => {
  router.push({
    path: '/home/order/detail',
    query: { id: order.order_id, name: '订单详情', list_status: listStatusContext.value },
  })
}

const goCreate = () => {
  router.push({ path: '/home/order/create', query: { name: '新建订单' } })
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

onMounted(() => {
  loadMore()
})
</script>

<template>
  <div class="page">
    <div class="search-wrap">
      <div class="search-inner">
        <van-icon name="search" class="search-icon" />
        <input
          v-model="search"
          class="search-input"
          placeholder="搜索订单号 / 收货人 / 电话"
          @keyup.enter="onSearch"
        />
        <button v-if="search" class="clear-btn" @click="onClear">
          <van-icon name="cross" size="14" />
        </button>
        <button class="search-btn" @click="onSearch">搜索</button>
        <button v-if="showCreate" class="create-btn" @click="goCreate">新建</button>
      </div>
      <div class="filter-row">
        <div class="filter-chip" @click="showCalendar = true">
          <van-icon name="clock-o" />
          <span>{{ dateRangeText || '创建时间范围' }}</span>
        </div>
        <button v-if="dateRangeText" class="clear-filter" @click="clearDateRange">清除</button>
      </div>
    </div>

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
          <div class="card-header">
            <div class="order-no">{{ order.order_no }}</div>
            <span class="status-badge" :class="statusClass(order.order_status)">
              {{ order.order_status_str || '-' }}
            </span>
          </div>
          <div class="card-body">
            <div class="row">
              <span class="label">收货人</span>
              <span class="value">{{ order.receiver_name || '-' }}</span>
            </div>
            <div class="row">
              <span class="label">电话</span>
              <span class="value">{{ order.receiver_phone || '-' }}</span>
            </div>
            <div class="row">
              <span class="label">公司</span>
              <span class="value">{{ order.receiver_company || '-' }}</span>
            </div>
            <div class="row">
              <span class="label">创建</span>
              <span class="value">{{ order.create_time_str || '-' }}</span>
            </div>
          </div>
          <div class="card-footer">
            <div class="tag-group">
              <span class="meta-tag pay">{{ order.pay_status_str || '-' }}</span>
              <span class="meta-tag ship">{{ order.ship_status_str || '-' }}</span>
            </div>
            <div class="amount">￥{{ formatMoney(order.payable_amount) }}</div>
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
      v-model:show="showCalendar"
      type="range"
      color="#2563eb"
      @confirm="onConfirmRange"
    />
  </div>
</template>

<style scoped>
.page {
  min-height: 100%;
  background: #f2f3f7;
}

.search-wrap {
  position: sticky;
  top: 0;
  z-index: 12;
  padding: 10px 12px 8px;
  background: #f2f3f7;
}

.search-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  background: #fff;
  border-radius: 20px;
  padding: 0 10px 0 14px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.search-icon {
  color: #bbb;
  font-size: 16px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px;
  color: #333;
  background: transparent;
  min-width: 0;
}

.search-input::placeholder {
  color: #bbb;
}

.clear-btn {
  border: none;
  background: transparent;
  padding: 4px;
  color: #bbb;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.search-btn {
  border: none;
  background: linear-gradient(90deg, #5b6ef5, #8b5cf6);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 0 12px;
  height: 28px;
  border-radius: 14px;
  cursor: pointer;
  flex-shrink: 0;
}

.create-btn {
  border: none;
  background: rgba(7, 193, 96, 0.12);
  color: #07c160;
  font-size: 12px;
  font-weight: 600;
  padding: 0 12px;
  height: 28px;
  border-radius: 14px;
  cursor: pointer;
  flex-shrink: 0;
}

.filter-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #fff;
  font-size: 12px;
  color: #475569;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
}

.filter-chip :deep(.van-icon) {
  color: #64748b;
}

.clear-filter {
  border: none;
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 999px;
  cursor: pointer;
}

.list {
  padding: 10px 12px 24px;
  min-height: calc(100dvh - 160px);
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
  border-radius: 16px;
  padding: 12px 14px;
  margin-bottom: 12px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.order-card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.order-no {
  font-size: 15px;
  font-weight: 700;
  color: #1f2a44;
}

.status-badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid transparent;
}

.status-created {
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
  border-color: rgba(59, 130, 246, 0.24);
}

.status-confirmed {
  background: rgba(139, 92, 246, 0.12);
  color: #7c3aed;
  border-color: rgba(139, 92, 246, 0.24);
}

.status-scheduled {
  background: rgba(14, 165, 233, 0.12);
  color: #0284c7;
  border-color: rgba(14, 165, 233, 0.24);
}

.status-producing {
  background: rgba(245, 158, 11, 0.12);
  color: #d97706;
  border-color: rgba(245, 158, 11, 0.24);
}

.status-finished {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
  border-color: rgba(16, 185, 129, 0.24);
}

.status-shipped {
  background: rgba(20, 184, 166, 0.12);
  color: #0f766e;
  border-color: rgba(20, 184, 166, 0.24);
}

.status-completed {
  background: rgba(15, 23, 42, 0.08);
  color: #0f172a;
  border-color: rgba(15, 23, 42, 0.18);
}

.status-canceled {
  background: rgba(148, 163, 184, 0.2);
  color: #64748b;
  border-color: rgba(148, 163, 184, 0.32);
}

.card-body {
  display: grid;
  gap: 6px;
  margin-bottom: 10px;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
}

.label {
  color: rgba(31, 42, 68, 0.55);
}

.value {
  color: #1f2a44;
  font-weight: 600;
  text-align: right;
  flex: 1;
  word-break: break-all;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.tag-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.meta-tag {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 999px;
  background: #f1f5ff;
  color: #4f46e5;
}

.meta-tag.ship {
  background: #ecfeff;
  color: #0ea5e9;
}

.amount {
  font-size: 14px;
  font-weight: 700;
  color: #1f2a44;
}
</style>
