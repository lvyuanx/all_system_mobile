<script setup>
defineOptions({ name: 'OrderDetail' })
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import {
  cancelOrder,
  completeOrder,
  confirmOrder,
  finishProduction,
  getOrderInfo,
  scheduleOrder,
  startProduction,
} from '@/api/order'
import { ORDER_STATUS, formatMoney } from '@/utils/orderConstants'

const route = useRoute()
const router = useRouter()

const orderId = computed(() => Number(route.query.id || route.query.order_id || 0))
const detail = ref(null)
const loading = ref(false)

const listStatus = computed(() => {
  const raw = route.query.list_status
  if (raw === undefined || raw === null || raw === '') return null
  if (raw === 'all') return 'all'
  const num = Number(raw)
  return Number.isNaN(num) ? null : num
})
const isAllContext = computed(() => listStatus.value === 'all')

const fetchDetail = async () => {
  if (!orderId.value) {
    showToast('缺少订单信息')
    router.back()
    return
  }
  loading.value = true
  try {
    const res = await getOrderInfo(orderId.value, { loading: false })
    detail.value = res?.data || null
  } catch {
    showToast('订单详情加载失败')
  } finally {
    loading.value = false
  }
}

const canPay = computed(() => {
  if (!detail.value) return false
  if (Number(detail.value.order_status) === ORDER_STATUS.CANCELED) return false
  const payable = Number(detail.value.payable_amount || 0)
  const paid = Number(detail.value.paid_amount || 0)
  return payable - paid > 0.0001
})

const actionButtons = computed(() => {
  if (!detail.value) return []
  const status = Number(detail.value.order_status)
  const actions = []

  if (isAllContext.value) {
    if (canPay.value) {
      actions.push({ key: 'pay', label: '收款', type: 'warning', route: '/home/order/pay' })
    }
    actions.push({ key: 'timeline', label: '操作日志', type: 'ghost', route: '/home/order/timeline' })
    return actions
  }

  if (status === ORDER_STATUS.CREATED) {
    actions.push({ key: 'confirm', label: '确认订单', type: 'primary' })
  }
  if (status === ORDER_STATUS.CONFIRMED) {
    actions.push({ key: 'schedule', label: '排产', type: 'primary' })
  }
  if ([ORDER_STATUS.CREATED, ORDER_STATUS.CONFIRMED].includes(status)) {
    actions.push({ key: 'cancel', label: '取消订单', type: 'danger' })
  }
  if (status === ORDER_STATUS.SCHEDULED) {
    actions.push({ key: 'start_production', label: '开始生产', type: 'primary' })
  }
  if (status === ORDER_STATUS.PRODUCING) {
    actions.push({ key: 'finish_production', label: '生产完成', type: 'primary' })
  }
  if (status === ORDER_STATUS.FINISHED) {
    actions.push({ key: 'ship', label: '发货', type: 'primary', route: '/home/order/ship' })
  }
  if (status === ORDER_STATUS.SHIPPED) {
    actions.push({ key: 'complete', label: '签收完成', type: 'primary' })
  }
  if (canPay.value) {
    actions.push({ key: 'pay', label: '收款', type: 'warning', route: '/home/order/pay' })
  }

  actions.push({ key: 'timeline', label: '操作日志', type: 'ghost', route: '/home/order/timeline' })
  return actions
})

const topActions = computed(() =>
  actionButtons.value.filter((item) => ['pay', 'timeline'].includes(item.key)),
)

const bottomActions = computed(() =>
  actionButtons.value.filter((item) => !['pay', 'timeline'].includes(item.key)),
)

const actionApiMap = {
  cancel: cancelOrder,
  confirm: confirmOrder,
  schedule: scheduleOrder,
  start_production: startProduction,
  finish_production: finishProduction,
  complete: completeOrder,
}

const actionConfirmText = {
  cancel: '确认取消该订单吗？',
  confirm: '确认该订单已通过审核？',
  schedule: '确认进入排产流程？',
  start_production: '确认开始生产？',
  finish_production: '确认生产完成？',
  complete: '确认签收完成？',
}

const handleAction = async (action) => {
  if (action.route) {
    const listStatusQuery = listStatus.value === null ? undefined : listStatus.value
    router.push({
      path: action.route,
      query: { id: orderId.value, name: action.label, list_status: listStatusQuery },
    })
    return
  }

  const api = actionApiMap[action.key]
  if (!api) return

  try {
    await showConfirmDialog({
      title: '提示',
      message: actionConfirmText[action.key] || '确认执行该操作？',
    })
  } catch {
    return
  }

  try {
    await api({ order_id: orderId.value }, { loading: false })
    showToast('操作成功')
    await fetchDetail()
  } catch {
    // 错误由拦截器处理
  }
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

onMounted(fetchDetail)
</script>

<template>
  <div class="page">
    <van-loading v-if="loading" class="page-loading" color="#2563eb" />
    <template v-else-if="detail">
      <section class="hero">
        <div class="hero-top">
          <div class="order-no">{{ detail.order_no }}</div>
          <span class="status-badge" :class="statusClass(detail.order_status)">
            {{ detail.order_status_str || '-' }}
          </span>
        </div>
        <div class="hero-amounts">
          <div class="amount-item">
            <span class="amount-label">应付</span>
            <span class="amount-value">￥{{ formatMoney(detail.payable_amount) }}</span>
          </div>
          <div class="amount-item">
            <span class="amount-label">已付</span>
            <span class="amount-value">￥{{ formatMoney(detail.paid_amount) }}</span>
          </div>
        </div>
        <div class="hero-tags">
          <span class="meta-tag pay">{{ detail.pay_status_str || '-' }}</span>
          <span class="meta-tag ship">{{ detail.ship_status_str || '-' }}</span>
          <span class="meta-tag type">{{ detail.order_type_str || '-' }}</span>
        </div>
        <div v-if="topActions.length" class="hero-action-title">快捷操作</div>
        <div v-if="topActions.length" class="hero-actions">
          <button
            v-for="action in topActions"
            :key="action.key"
            class="action-btn top-action"
            :class="action.type"
            @click="handleAction(action)"
          >
            {{ action.label }}
          </button>
        </div>
      </section>

      <section class="card">
        <div class="card-header">收货信息</div>
        <div class="card-body">
          <div class="row">
            <span class="label">收货人</span>
            <span class="value">{{ detail.receiver_name || '-' }}</span>
          </div>
          <div class="row">
            <span class="label">电话</span>
            <span class="value">{{ detail.receiver_phone || '-' }}</span>
          </div>
          <div class="row">
            <span class="label">公司</span>
            <span class="value">{{ detail.receiver_company || '-' }}</span>
          </div>
          <div class="row">
            <span class="label">地址</span>
            <span class="value">{{ detail.receiver_address || '-' }}</span>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-header">发货信息</div>
        <div class="card-body">
          <div class="row">
            <span class="label">发货方</span>
            <span class="value">{{ detail.shipping_party || '-' }}</span>
          </div>
          <div class="row">
            <span class="label">公司</span>
            <span class="value">{{ detail.shipping_party_company || '-' }}</span>
          </div>
          <div class="row">
            <span class="label">电话</span>
            <span class="value">{{ detail.shipping_party_phone || '-' }}</span>
          </div>
          <div class="row">
            <span class="label">地址</span>
            <span class="value">{{ detail.shipping_party_address || '-' }}</span>
          </div>
          <div class="row">
            <span class="label">配送</span>
            <span class="value">{{ detail.delivery_method_str || '-' }}</span>
          </div>
          <div class="row">
            <span class="label">物流</span>
            <span class="value">{{ detail.tracking_no || '-' }}</span>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-header">金额信息</div>
        <div class="card-body">
          <div class="row">
            <span class="label">总额</span>
            <span class="value">￥{{ formatMoney(detail.total_amount) }}</span>
          </div>
          <div class="row">
            <span class="label">优惠</span>
            <span class="value">￥{{ formatMoney(detail.discount_amount) }}</span>
          </div>
          <div class="row">
            <span class="label">运费</span>
            <span class="value">￥{{ formatMoney(detail.shipping_fee) }}</span>
          </div>
          <div class="row">
            <span class="label">应付</span>
            <span class="value">￥{{ formatMoney(detail.payable_amount) }}</span>
          </div>
          <div class="row">
            <span class="label">已付</span>
            <span class="value">￥{{ formatMoney(detail.paid_amount) }}</span>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-header">订单明细</div>
        <div class="card-body">
          <div v-if="!detail.items?.length" class="empty">暂无订单项</div>
          <div v-for="item in detail.items" :key="item.item_id" class="item-card">
            <div class="item-title">{{ item.pattern_code }} · {{ item.color }}</div>
            <div class="item-row">
              <span class="label">数量</span>
              <span class="value">{{ item.count }} {{ item.total_unit || '' }}</span>
            </div>
            <div class="item-row">
              <span class="label">单价</span>
              <span class="value">￥{{ formatMoney(item.unit_price) }}</span>
            </div>
            <div class="item-row">
              <span class="label">优惠</span>
              <span class="value">￥{{ formatMoney(item.discount_price) }}</span>
            </div>
            <div class="item-row">
              <span class="label">小计</span>
              <span class="value">￥{{ formatMoney(item.subtotal) }}</span>
            </div>
            <div class="item-row" v-if="item.memo">
              <span class="label">备注</span>
              <span class="value">{{ item.memo }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="card" v-if="detail.memo">
        <div class="card-header">备注</div>
        <div class="card-body">
          <div class="memo">{{ detail.memo }}</div>
        </div>
      </section>

      <div v-if="bottomActions.length" class="action-bar">
        <button
          v-for="action in bottomActions"
          :key="action.key"
          class="action-btn"
          :class="action.type"
          @click="handleAction(action)"
        >
          {{ action.label }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page {
  min-height: 100%;
  background: #f4f6fb;
  padding-bottom: 100px;
}

.page-loading {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.hero {
  padding: 20px 16px 16px;
  background: radial-gradient(circle at 15% 0%, rgba(59, 130, 246, 0.35) 0%, rgba(59, 130, 246, 0) 50%),
    radial-gradient(circle at 90% 10%, rgba(16, 185, 129, 0.28) 0%, rgba(16, 185, 129, 0) 45%),
    linear-gradient(150deg, #ffffff 0%, #f1f5ff 75%, #ecf4ff 100%);
  border-radius: 0 0 24px 24px;
  box-shadow: 0 8px 24px rgba(31, 42, 68, 0.08);
}

.hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.order-no {
  font-size: 20px;
  font-weight: 800;
  color: #1f2a44;
}

.status-badge {
  font-size: 12px;
  padding: 4px 10px;
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

.hero-amounts {
  margin-top: 14px;
  display: flex;
  gap: 14px;
}

.amount-item {
  flex: 1;
  background: #fff;
  border-radius: 14px;
  padding: 10px 12px;
  box-shadow: 0 4px 12px rgba(31, 42, 68, 0.08);
}

.amount-label {
  font-size: 11px;
  color: rgba(31, 42, 68, 0.55);
}

.amount-value {
  margin-top: 6px;
  font-size: 16px;
  font-weight: 700;
  color: #1f2a44;
}

.hero-tags {
  margin-top: 12px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.hero-actions {
  margin-top: 8px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.hero-action-title {
  margin-top: 14px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(31, 42, 68, 0.65);
}

.top-action {
  box-shadow: 0 4px 12px rgba(31, 42, 68, 0.12);
}

.meta-tag {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 999px;
  background: #f1f5ff;
  color: #4f46e5;
}

.meta-tag.ship {
  background: #ecfeff;
  color: #0ea5e9;
}

.meta-tag.type {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}

.card {
  margin: 14px 14px 0;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(31, 42, 68, 0.08);
  overflow: hidden;
}

.card-header {
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 700;
  color: #1f2a44;
  background: #f7f9ff;
  border-bottom: 1px solid rgba(31, 42, 68, 0.06);
}

.card-body {
  padding: 12px 14px 14px;
  display: grid;
  gap: 8px;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
}

.label {
  color: rgba(31, 42, 68, 0.55);
  flex-shrink: 0;
}

.value {
  color: #1f2a44;
  font-weight: 600;
  text-align: right;
  flex: 1;
  word-break: break-all;
}

.item-card {
  padding: 12px;
  border-radius: 12px;
  background: #f9fafc;
  border: 1px solid rgba(31, 42, 68, 0.06);
  display: grid;
  gap: 6px;
}

.item-title {
  font-size: 13px;
  font-weight: 700;
  color: #1f2a44;
}

.item-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
}

.memo {
  font-size: 12px;
  color: rgba(31, 42, 68, 0.75);
  line-height: 1.6;
}

.empty {
  font-size: 12px;
  color: rgba(31, 42, 68, 0.5);
  text-align: center;
  padding: 12px 0;
}

.action-bar {
  position: sticky;
  bottom: 0;
  padding: 12px 14px 18px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.action-btn {
  border: none;
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.action-btn.primary {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  color: #fff;
}

.action-btn.warning {
  background: rgba(245, 158, 11, 0.16);
  color: #b45309;
}

.action-btn.danger {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
}

.action-btn.ghost {
  background: #f5f5f5;
  color: #475569;
}
</style>
