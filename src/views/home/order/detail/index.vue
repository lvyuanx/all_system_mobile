<script setup>
defineOptions({ name: 'OrderDetail' })

import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import {
  cancelOrder,
  completeOrder,
  confirmOrder,
  finishProduction,
  getOrderInfo,
  getOrderStatusFlow,
  getOrderTimeline,
  scheduleOrder,
  startProduction,
} from '@/api/order'
import { ORDER_STATUS, formatMoney } from '@/utils/orderConstants'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const orderId = computed(() => Number(route.query.id || route.query.order_id || 0))
const navTitle = computed(() => route.query.name || '订单详情')

const detail = ref(null)
const timeline = ref([])
const statusFlow = ref([])
const loading = ref(false)
const loadError = ref(false)

const listStatus = computed(() => {
  const raw = route.query.list_status
  if (raw === undefined || raw === null || raw === '') return null
  if (raw === 'all') return 'all'
  const num = Number(raw)
  return Number.isNaN(num) ? null : num
})

const isAllContext = computed(() => listStatus.value === 'all')
const showEmpty = computed(() => !loading.value && !loadError.value && !detail.value)

const fetchDetail = async () => {
  if (!orderId.value) {
    showToast('缺少订单信息')
    router.back()
    return
  }

  loading.value = true
  loadError.value = false

  try {
    const [orderRes, tlRes, flowRes] = await Promise.all([
      getOrderInfo(orderId.value, { loading: false }),
      getOrderTimeline(orderId.value, { loading: false }),
      getOrderStatusFlow({ loading: false }),
    ])
    detail.value = orderRes?.data || null
    timeline.value = tlRes?.data || []
    const branches = flowRes?.data?.branches || []
    const isCanceled = Number(detail.value?.order_status) === ORDER_STATUS.CANCELED
    const branch = branches.find((b) => b.branch === (isCanceled ? 'cancel' : 'complete'))
    statusFlow.value = branch?.statuses || []
  } catch {
    detail.value = null
    loadError.value = true
    showToast('订单详情加载失败')
  } finally {
    loading.value = false
  }
}

const retryFetch = () => {
  fetchDetail()
}

const canPay = computed(() => {
  if (!detail.value) return false
  if (Number(detail.value.order_status) === ORDER_STATUS.CANCELED) return false

  const payable = Number(detail.value.payable_amount || 0)
  const paid = Number(detail.value.paid_amount || 0)
  return payable - paid > 0.0001
})

const permCodes = computed(() =>
  (userStore.permPacks || [])
    .map((p) => p.pack_code || p.packCode)
    .filter(Boolean),
)

const hasPerm = (...codes) => codes.some((code) => permCodes.value.includes(code))

const canViewPayDetail = computed(() => hasPerm('ORDER_CREATE_MANAGE', 'FINANCE_MANAGE'))
const canViewFinanceOps = computed(() => hasPerm('FINANCE_MANAGE'))
const canViewLogistics = computed(() => hasPerm('ORDER_COMPLETE_MANAGE', 'ORDER_CREATE_MANAGE'))

const actionButtons = computed(() => {
  if (!detail.value) return []

  const status = Number(detail.value.order_status)
  const actions = []

  if (isAllContext.value) {
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
  if (canPay.value && canViewFinanceOps.value) {
    actions.push({ key: 'pay', label: '收款', type: 'warning', route: '/home/order/pay' })
  }

  return actions
})

const footerActions = computed(() =>
  actionButtons.value.filter((a) => a.key !== 'pay'),
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

const statusConfig = computed(() => {
  const s = Number(detail.value?.order_status ?? route.query.order_status)
  const map = {
    [ORDER_STATUS.CREATED]:    { cls: 'status-created',    icon: 'clock-o',         color: '#2563eb' },
    [ORDER_STATUS.CONFIRMED]:  { cls: 'status-confirmed',  icon: 'passed',          color: '#7c3aed' },
    [ORDER_STATUS.SCHEDULED]:  { cls: 'status-scheduled',  icon: 'todo-list-o',     color: '#0284c7' },
    [ORDER_STATUS.PRODUCING]:  { cls: 'status-producing',  icon: 'fire-o',          color: '#d97706' },
    [ORDER_STATUS.FINISHED]:   { cls: 'status-finished',   icon: 'completed',       color: '#059669' },
    [ORDER_STATUS.SHIPPED]:    { cls: 'status-shipped',    icon: 'logistics',       color: '#0f766e' },
    [ORDER_STATUS.COMPLETED]:  { cls: 'status-completed',  icon: 'award-o',         color: '#1f2937' },
    [ORDER_STATUS.CANCELED]:   { cls: 'status-canceled',   icon: 'close-circle-o',  color: '#94a3b8' },
  }
  return map[s] || { cls: '', icon: 'clock-o', color: '#94a3b8' }
})

const itemCountText = (item) => {
  const count = item?.count ?? 0
  return `${count} 件`
}

const statusFlowActive = computed(() => {
  if (!detail.value || !statusFlow.value.length) return 0
  const idx = statusFlow.value.findIndex((s) => s.status === Number(detail.value.order_status))
  return idx >= 0 ? idx : 0
})

// 将 statusFlow 与 timeline 合并：按顺序把日志条目挂到对应流程步骤上
const mergedFlow = computed(() => {
  const flow = statusFlow.value
  if (!flow.length) return []
  // timeline 按时间正序（最早 → 最新），与流程步骤一一对应
  return flow.map((step, idx) => ({
    ...step,
    log: timeline.value[idx] || null,
  }))
})

const onClickLeft = () => {
  const hasBack = Boolean(window.history.state?.back)
  if (hasBack) {
    router.back()
    return
  }
  router.replace('/home/order')
}

const goClientList = (company) => {
  if (!company) return
  router.push({ path: '/home/client', query: { keyword: company } })
}

const goPatternDetail = (item) => {
  if (!item.pattern_code && !item.pattern_id) return
  router.push({
    path: '/home/pattern-library/detail',
    query: { code: item.pattern_code, pattern_id: item.pattern_id },
  })
}

const pageRef = ref(null)
const isCollapsed = ref(false)
let lastScrollTop = 0
let rafId = null
const THRESHOLD = 8

const onScroll = () => {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    const el = pageRef.value
    if (!el) return
    const current = el.scrollTop
    const delta = current - lastScrollTop
    if (current <= 0) {
      isCollapsed.value = false
    } else if (delta > THRESHOLD) {
      isCollapsed.value = true
    } else if (delta < -THRESHOLD) {
      isCollapsed.value = false
    }
    lastScrollTop = current
  })
}

const navOrderNoVisible = isCollapsed

onMounted(() => {
  fetchDetail()
  pageRef.value?.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  pageRef.value?.removeEventListener('scroll', onScroll)
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div ref="pageRef" class="page">
    <!-- 顶部合并头部：返回 + 状态 -->
    <div class="sticky-header" :class="statusConfig.cls || 'status-default'">
      <div class="header-nav">
        <button class="back-btn" @click="onClickLeft">
          <van-icon name="arrow-left" size="20" />
        </button>
        <div class="header-title">{{ navTitle }}</div>
        <div class="header-nav-order-no" :class="{ visible: navOrderNoVisible }">
          {{ detail?.order_no || '' }}
        </div>
      </div>

      <div class="header-status" :class="{ collapsed: isCollapsed }">
        <template v-if="detail">
          <van-icon :name="statusConfig.icon" class="status-icon" />
          <div class="status-info">
            <div class="status-label">{{ detail.order_status_str }}</div>
            <div class="status-order-no">{{ detail.order_no }}</div>
          </div>
        </template>
        <template v-else>
          <div class="status-skeleton">
            <div class="skeleton-line skeleton-label" />
            <div class="skeleton-line skeleton-no" />
          </div>
        </template>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="full-center">
      <van-loading size="28" color="#2563eb" vertical>加载中...</van-loading>
    </div>

    <template v-else-if="detail">

      <!-- 内容区 -->
      <div class="content">

        <!-- 支付明细 -->
        <div v-if="canViewPayDetail" class="card">
          <div class="card-header">
            <van-icon name="bill-o" class="card-icon" />
            <span class="card-title">支付明细</span>
            <van-button
              v-if="canViewFinanceOps && canPay"
              size="small"
              round
              class="pay-btn"
              @click="handleAction({ key: 'pay', label: '收款', type: 'warning', route: '/home/order/pay' })"
            >收款</van-button>
          </div>
          <!-- 应付 / 已付 汇总 -->
          <div class="amount-row">
            <div class="amount-item">
              <span class="amount-label">应付金额</span>
              <span class="amount-value is-payable">￥{{ formatMoney(detail.payable_amount) }}</span>
            </div>
            <div v-if="canViewFinanceOps" class="amount-divider" />
            <div v-if="canViewFinanceOps" class="amount-item">
              <span class="amount-label">已付金额</span>
              <span class="amount-value is-paid">￥{{ formatMoney(detail.paid_amount) }}</span>
            </div>
          </div>
          <div class="amount-meta">
            <span>下单时间：{{ detail.create_time_str || '-' }}</span>
            <span class="dot-sep">·</span>
            <span>{{ detail.order_type_str || '-' }}</span>
            <span class="dot-sep">·</span>
            <span>{{ detail.pay_status_str || '-' }}</span>
          </div>
          <!-- 明细列表 -->
          <div class="info-list" style="margin-top: 12px;">
            <div class="info-row">
              <span class="info-key">商品总额</span>
              <span class="info-val">￥{{ formatMoney(detail.total_amount) }}</span>
            </div>
            <div class="info-row">
              <span class="info-key">优惠金额</span>
              <span class="info-val discount">－￥{{ formatMoney(detail.discount_amount) }}</span>
            </div>
            <div class="info-row">
              <span class="info-key">运费</span>
              <span class="info-val">￥{{ formatMoney(detail.shipping_fee) }}</span>
            </div>
          </div>
        </div>

        <!-- 订单商品 -->
        <div class="card">
          <div class="card-header">
            <van-icon name="goods-collect-o" class="card-icon" />
            <span class="card-title">订单项</span>
            <span class="card-badge">{{ detail.items?.length || 0 }} 件</span>
          </div>
          <van-empty v-if="!detail.items?.length" image="search" description="暂无订单项" />
          <div
            v-for="(item, idx) in detail.items"
            :key="item.item_id || `${item.pattern_code}-${item.color}`"
            class="goods-item"
            :class="{ 'goods-item--bordered': idx > 0 }"
          >
            <div class="goods-image-wrap" @click="goPatternDetail(item)">
              <van-image
                v-if="item.main_image"
                :src="item.main_image"
                class="goods-image"
                width="72"
                height="72"
                fit="cover"
                radius="8"
              />
              <div v-else class="goods-image-empty">
                <van-icon name="photo-o" size="24" color="#cbd5e1" />
              </div>
            </div>
            <div class="goods-detail">
              <div class="goods-code">{{ item.pattern_code || '-' }}</div>
              <div class="goods-color">
                <van-icon name="palette-o" size="12" />
                {{ item.color || '-' }}
              </div>
              <div class="goods-row">
                <span class="goods-qty">× {{ itemCountText(item) }}</span>
                <span v-if="canViewPayDetail" class="goods-price">￥{{ formatMoney(item.unit_price) }}/件</span>
              </div>
              <div v-if="item.discount_price && Number(item.discount_price)" class="goods-discount">
                优惠 ￥{{ formatMoney(item.discount_price) }}
              </div>
              <div v-if="canViewPayDetail" class="goods-subtotal">小计：<span class="is-payable">￥{{ formatMoney(item.subtotal) }}</span></div>
              <div v-if="item.memo" class="goods-memo">备注：{{ item.memo }}</div>
            </div>
          </div>
        </div>

        <!-- 物流信息 -->
        <div v-if="canViewLogistics" class="card">
          <div class="card-header">
            <van-icon name="logistics" class="card-icon" />
            <span class="card-title">物流信息</span>
          </div>
          <div class="info-list">
            <div class="info-row">
              <span class="info-key">配送方式</span>
              <span class="info-val">{{ detail.delivery_method_str || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-key">发货状态</span>
              <span class="info-val">{{ detail.ship_status_str || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-key">物流单号</span>
              <span class="info-val tracking">{{ detail.tracking_no || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 收发货方信息（合并卡片） -->
        <div v-if="canViewLogistics" class="card">
          <div class="card-header">
            <van-icon name="location-o" class="card-icon" />
            <span class="card-title">收发货信息</span>
          </div>

          <div class="address-block">
            <div class="address-tag sender-tag">发</div>
            <div class="address-body">
              <div class="address-name">{{ detail.shipping_party || '-' }}</div>
              <div class="address-sub">{{ detail.shipping_party_company || '-' }}</div>
              <div class="address-sub">
                <van-icon name="phone-o" size="12" />
                {{ detail.shipping_party_phone || '-' }}
              </div>
              <div class="address-sub addr-text">{{ detail.shipping_party_address || '-' }}</div>
            </div>
          </div>

          <div class="address-arrow">
            <van-icon name="arrow-down" size="16" color="#94a3b8" />
          </div>

          <div class="address-block">
            <div class="address-tag receiver-tag">收</div>
            <div class="address-body">
              <div class="address-name">{{ detail.receiver_name || '-' }}</div>
              <div class="address-sub address-sub--link" @click="goClientList(detail.receiver_company)">{{ detail.receiver_company || '-' }}</div>
              <div class="address-sub">
                <van-icon name="phone-o" size="12" />
                {{ detail.receiver_phone || '-' }}
              </div>
              <div class="address-sub addr-text">{{ detail.receiver_address || '-' }}</div>
            </div>
          </div>
        </div>

        <!-- 备注 -->
        <div v-if="detail.memo" class="card">
          <div class="card-header">
            <van-icon name="edit" class="card-icon" />
            <span class="card-title">订单备注</span>
          </div>
          <div class="memo-text">{{ detail.memo }}</div>
        </div>

        <!-- 订单进度 -->
        <div class="card">
          <div class="card-header">
            <van-icon name="notes-o" class="card-icon" />
            <span class="card-title">订单进度</span>
          </div>
          <van-steps
            v-if="mergedFlow.length"
            direction="vertical"
            :active="statusFlowActive"
            class="flow-steps"
          >
            <van-step v-for="item in mergedFlow" :key="item.status">
              <div class="flow-step-name">{{ item.status_str }}</div>
              <template v-if="item.log">
                <div class="flow-step-desc">
                  <span v-if="item.log.item_user">
                    {{ item.log.item_user }}{{ item.log.item_phone ? ` (${item.log.item_phone})` : '' }}
                  </span>
                  <span class="flow-step-time">{{ item.log.item_time }}</span>
                </div>
                <div v-if="item.log.item_memo" class="flow-step-memo">{{ item.log.item_memo }}</div>
              </template>
            </van-step>
          </van-steps>
          <van-steps
            v-else-if="timeline.length"
            direction="vertical"
            :active="timeline.length - 1"
            class="flow-steps"
          >
            <van-step v-for="(item, idx) in timeline" :key="idx">
              <div class="flow-step-name">{{ item.item_title }}</div>
              <div class="flow-step-desc">
                <span v-if="item.item_user">{{ item.item_user }}{{ item.item_phone ? ` (${item.item_phone})` : '' }}</span>
                <span class="flow-step-time">{{ item.item_time }}</span>
              </div>
              <div v-if="item.item_memo" class="flow-step-memo">{{ item.item_memo }}</div>
            </van-step>
          </van-steps>
          <van-empty v-else image="search" description="暂无进度记录" />
        </div>

      </div>
    </template>

    <!-- 加载失败 -->
    <div v-else-if="loadError" class="state-wrap">
      <van-empty image="error" description="详情加载失败，请稍后重试">
        <van-button round type="primary" class="retry-btn" @click="retryFetch">重新加载</van-button>
      </van-empty>
    </div>

    <!-- 空数据 -->
    <div v-else-if="showEmpty" class="state-wrap">
      <van-empty image="search" description="暂无订单详情" />
    </div>

    <!-- 底部操作栏 -->
    <footer v-if="detail && footerActions.length" class="footer-bar">
      <van-button
        v-for="action in footerActions"
        :key="action.key"
        round
        class="footer-btn"
        :class="`footer-btn--${action.type}`"
        @click="handleAction(action)"
      >
        {{ action.label }}
      </van-button>
    </footer>
  </div>
</template>

<style scoped>
/* ===== 全局变量 ===== */
.page {
  --c-primary: #2563eb;
  --c-primary-light: #eff6ff;
  --c-danger: #dc2626;
  --c-danger-light: #fef2f2;
  --c-success: #059669;
  --c-success-light: #ecfdf5;
  --c-warning: #d97706;
  --c-warning-light: #fffbeb;
  --c-text: #111827;
  --c-sub: #6b7280;
  --c-muted: #9ca3af;
  --c-border: #e5e7eb;
  --c-bg: #f3f4f6;
  --c-card: #ffffff;
  --radius: 12px;
  --shadow: 0 1px 0 rgba(0, 0, 0, 0.06);

  min-height: 100vh;
  height: 100vh;
  overflow-y: auto;
  background: var(--c-bg);
  padding-bottom: calc(80px + env(safe-area-inset-bottom));
}

/* ===== 合并头部（navbar + 状态） ===== */
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 100;
  padding-top: env(safe-area-inset-top);
  overflow: hidden;
  transition: background 0.3s ease;
}

.sticky-header::after {
  content: '';
  position: absolute;
  right: -24px;
  top: -24px;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  pointer-events: none;
}

.header-nav {
  height: 46px;
  display: grid;
  grid-template-columns: 44px 1fr auto;
  align-items: center;
  padding-right: 12px;
  position: relative;
  z-index: 1;
}

.back-btn {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.header-title {
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-right {
  display: flex;
  gap: 6px;
  align-items: center;
}

.header-nav-order-no {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  padding-right: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.header-nav-order-no.visible {
  opacity: 1;
  transform: translateY(0);
}

.header-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 16px 16px;
  position: relative;
  z-index: 1;
  max-height: 100px;
  opacity: 1;
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.25s ease, padding 0.3s ease;
}

.header-status.collapsed {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.status-icon {
  font-size: 28px;
  color: rgba(255, 255, 255, 0.85);
  flex-shrink: 0;
}

.status-info {
  flex: 1;
  min-width: 0;
}

.status-label {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  line-height: 1.3;
}

.status-order-no {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-skeleton {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skeleton-line {
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.25);
  animation: shimmer 1.2s ease-in-out infinite;
}

.skeleton-label {
  width: 80px;
  height: 16px;
}

.skeleton-no {
  width: 140px;
  height: 12px;
}

@keyframes shimmer {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 0.8; }
}

/* 状态颜色（同时作用于 sticky-header） */
.status-default   { background: linear-gradient(135deg, #2563eb, #3b82f6); }
.status-created   { background: linear-gradient(135deg, #2563eb, #3b82f6); }
.status-confirmed { background: linear-gradient(135deg, #7c3aed, #a78bfa); }
.status-scheduled { background: linear-gradient(135deg, #0284c7, #38bdf8); }
.status-producing { background: linear-gradient(135deg, #d97706, #fbbf24); }
.status-finished  { background: linear-gradient(135deg, #059669, #34d399); }
.status-shipped   { background: linear-gradient(135deg, #0f766e, #2dd4bf); }
.status-completed { background: linear-gradient(135deg, #374151, #6b7280); }
.status-canceled  { background: linear-gradient(135deg, #9ca3af, #cbd5e1); }

/* ===== 金额卡片 ===== */
.amount-row {
  display: flex;
  align-items: center;
}

.amount-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.amount-divider {
  width: 1px;
  height: 36px;
  background: var(--c-border);
  flex-shrink: 0;
}

.amount-label {
  font-size: 12px;
  color: var(--c-sub);
}

.amount-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.amount-meta {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--c-border);
  font-size: 12px;
  color: var(--c-muted);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
}

.dot-sep {
  margin: 0 4px;
  color: var(--c-border);
}

/* ===== 内容区 ===== */
.content {
  padding: 10px 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ===== 通用卡片 ===== */
.card {
  background: var(--c-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  padding: 14px 16px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
}

.card-icon {
  font-size: 16px;
  color: var(--c-primary);
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--c-text);
  flex: 1;
}

.card-badge {
  font-size: 12px;
  color: var(--c-primary);
  background: var(--c-primary-light);
  padding: 2px 8px;
  border-radius: 999px;
}

/* ===== 信息列表 ===== */
.info-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--c-border);
}

.info-row:last-child {
  border-bottom: none;
}

.info-key {
  font-size: 14px;
  color: var(--c-sub);
}

.info-val {
  font-size: 14px;
  color: var(--c-text);
  text-align: right;
  max-width: 60%;
}

.info-val.bold {
  font-weight: 700;
  font-size: 15px;
}

.info-val.discount {
  color: var(--c-success);
}

.info-val.tracking {
  font-family: monospace;
  word-break: break-all;
}

.info-divider {
  height: 1px;
  background: var(--c-border);
  margin: 4px 0;
}

/* ===== 商品项 ===== */
.goods-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
}

.goods-item--bordered {
  border-top: 1px solid var(--c-border);
}

.goods-image-wrap {
  flex-shrink: 0;
  cursor: pointer;
}

.goods-image-wrap:active {
  opacity: 0.7;
}

.goods-image {
  border-radius: 8px;
  border: 1px solid var(--c-border);
  display: block;
}

.goods-image-empty {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  border: 1px solid var(--c-border);
  background: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.goods-detail {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.goods-code {
  font-size: 15px;
  font-weight: 700;
  color: var(--c-text);
  line-height: 1.3;
}

.goods-color {
  font-size: 12px;
  color: var(--c-sub);
  display: flex;
  align-items: center;
  gap: 3px;
}

.goods-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;
}

.goods-qty {
  font-size: 13px;
  color: var(--c-sub);
}

.goods-price {
  font-size: 13px;
  color: var(--c-sub);
}

.goods-discount {
  font-size: 12px;
  color: var(--c-success);
}

.goods-subtotal {
  font-size: 13px;
  color: var(--c-sub);
  margin-top: 2px;
}

.goods-memo {
  font-size: 12px;
  color: var(--c-muted);
  background: #f9fafb;
  border-radius: 6px;
  padding: 4px 8px;
  margin-top: 2px;
}

/* ===== 收发货地址 ===== */
.address-block {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 4px 0;
}

.address-tag {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.sender-tag {
  background: #fff7ed;
  color: var(--c-warning);
  border: 1px solid #fed7aa;
}

.receiver-tag {
  background: var(--c-primary-light);
  color: var(--c-primary);
  border: 1px solid #bfdbfe;
}

.address-body {
  flex: 1;
  min-width: 0;
}

.address-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--c-text);
  margin-bottom: 4px;
}

.address-sub {
  font-size: 13px;
  color: var(--c-sub);
  line-height: 1.6;
  display: flex;
  align-items: center;
  gap: 4px;
}

.address-sub--link {
  color: var(--c-primary);
  cursor: pointer;
}

.addr-text {
  display: block;
  line-height: 1.5;
  word-break: break-all;
}

.address-arrow {
  text-align: center;
  padding: 8px 0;
  position: relative;
}

.address-arrow::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 24px;
  background: repeating-linear-gradient(to bottom, var(--c-border) 0px, var(--c-border) 4px, transparent 4px, transparent 8px);
}

/* ===== 备注 ===== */
.memo-text {
  font-size: 14px;
  color: var(--c-sub);
  line-height: 1.7;
  background: #f9fafb;
  border-radius: 8px;
  padding: 12px;
}

/* ===== 空/错误状态 ===== */
.full-center {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px 0;
}

.state-wrap {
  padding: 40px 0;
}

.retry-btn {
  margin-top: 12px;
  background: var(--c-primary);
  border-color: var(--c-primary);
}

/* ===== 底部操作栏 ===== */
.footer-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  gap: 10px;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid var(--c-border);
  backdrop-filter: blur(12px);
}

.footer-btn {
  flex: 1;
  height: 42px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 999px;
}

.footer-btn--primary {
  background: var(--c-primary) !important;
  border-color: var(--c-primary) !important;
  color: #fff !important;
}

.footer-btn--danger {
  background: var(--c-danger-light) !important;
  border-color: #fca5a5 !important;
  color: var(--c-danger) !important;
}

.footer-btn--warning {
  background: var(--c-warning-light) !important;
  border-color: #fcd34d !important;
  color: var(--c-warning) !important;
}

.footer-btn--ghost {
  background: #f8fafc !important;
  border-color: #cbd5e1 !important;
  color: #475569 !important;
}

/* ===== 颜色工具 ===== */
.is-payable { color: var(--c-danger); }
.is-paid    { color: var(--c-success); }

/* ===== 收款按钮（支付明细卡片内） ===== */
.pay-btn {
  height: 28px !important;
  font-size: 13px !important;
  font-weight: 600;
  padding: 0 14px !important;
  background: var(--c-warning-light) !important;
  border-color: #fcd34d !important;
  color: var(--c-warning) !important;
}

/* ===== 订单进度（合并） ===== */
.flow-steps {
  --van-step-active-color: var(--c-primary);
  --van-step-finish-line-color: #dbeafe;
  --van-steps-background: transparent;
  margin: 0 -16px;
}

/* 完成步骤连接线 */
.flow-steps :deep(.van-step--finish .van-step__line) {
  background: #dbeafe;
}

/* 完成步骤勾号图标 → 改为小圆点 */
.flow-steps :deep(.van-step--finish .van-icon-checked) {
  display: none;
}
.flow-steps :deep(.van-step--finish .van-step__circle) {
  width: 8px;
  height: 8px;
  background: #93c5fd;
  border: none;
}

/* 当前步骤圆点：实心主色 + 光晕 */
.flow-steps :deep(.van-step--process .van-step__circle) {
  width: 10px;
  height: 10px;
  background: var(--c-primary);
  border: none;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
}

/* 未到达步骤圆点：浅灰 */
.flow-steps :deep(.van-step--waiting .van-step__circle) {
  width: 8px;
  height: 8px;
  background: #e5e7eb;
  border: none;
}

/* 步骤内容区 */
.flow-step-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text);
  line-height: 1.4;
}

/* 已完成步骤名称略淡 */
.flow-steps :deep(.van-step--finish) .flow-step-name {
  color: var(--c-sub);
  font-weight: 500;
}

/* 未到达步骤名称更淡 */
.flow-steps :deep(.van-step--waiting) .flow-step-name {
  color: var(--c-muted);
  font-weight: 400;
}

.flow-step-desc {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--c-sub);
  padding-bottom: 14px;
}

.flow-step-time {
  color: var(--c-muted);
}

.flow-step-memo {
  font-size: 12px;
  color: var(--c-muted);
  background: #f9fafb;
  border-radius: 6px;
  padding: 4px 8px;
  margin-bottom: 14px;
}

/* 无日志时步骤只有标题，给底部留间距 */
.flow-steps :deep(.van-step__title) {
  padding-bottom: 2px;
}
</style>
