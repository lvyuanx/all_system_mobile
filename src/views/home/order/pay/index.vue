<script setup>
defineOptions({ name: 'OrderPay' })
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { getOrderInfo, getOrderPayCaList, getPayMethodTypeList, payOrder } from '@/api/order'
import { formatMoney, toNumber } from '@/utils/orderConstants'

const route = useRoute()
const router = useRouter()

const orderId = Number(route.query.id || route.query.order_id || 0)
const loading = ref(false)
const submitting = ref(false)

const detail = ref(null)
const payList = ref([])
const payMethods = ref([])
const showMethodSheet = ref(false)

const form = ref({
  pay_method: null,
  pay_method_label: '',
  pay_amount: '',
  operator_memo: '',
})

const remainingAmount = computed(() => {
  if (!detail.value) return 0
  const payable = toNumber(detail.value.payable_amount)
  const paid = toNumber(detail.value.paid_amount)
  return payable - paid
})

const fetchData = async () => {
  if (!orderId) {
    showToast('缺少订单信息')
    router.back()
    return
  }
  loading.value = true
  try {
    const [orderRes, methodRes, listRes] = await Promise.all([
      getOrderInfo(orderId, { loading: false }),
      getPayMethodTypeList({ loading: false }),
      getOrderPayCaList(orderId, { loading: false }),
    ])
    detail.value = orderRes?.data || null
    const methods = methodRes?.data || []
    payMethods.value = methods.map((item) => ({
      name: item.label || item.name,
      value: item.value,
    }))

    if (!form.value.pay_method && payMethods.value.length) {
      form.value.pay_method = payMethods.value[0].value
      form.value.pay_method_label = payMethods.value[0].name
    }

    payList.value = listRes?.data || []
    if (remainingAmount.value > 0 && !form.value.pay_amount) {
      form.value.pay_amount = remainingAmount.value.toFixed(2)
    }
  } catch {
    showToast('支付信息加载失败')
  } finally {
    loading.value = false
  }
}

const openMethodSheet = () => {
  if (!payMethods.value.length) return
  showMethodSheet.value = true
}

const onSelectMethod = (action) => {
  form.value.pay_method = action.value
  form.value.pay_method_label = action.name
  showMethodSheet.value = false
}

const onSubmit = async () => {
  if (submitting.value) return
  if (!form.value.pay_method) {
    showToast('请选择支付方式')
    return
  }
  const amount = toNumber(form.value.pay_amount)
  if (amount <= 0) {
    showToast('请输入有效收款金额')
    return
  }
  if (amount - remainingAmount.value > 0.0001) {
    showToast('收款金额超过应付余额')
    return
  }

  try {
    await showConfirmDialog({ title: '提示', message: '确认提交收款？' })
  } catch {
    return
  }

  submitting.value = true
  try {
    await payOrder(
      {
        order_id: orderId,
        pay_amount: amount,
        pay_method: form.value.pay_method,
        operator_memo: form.value.operator_memo || '',
      },
      { loading: false },
    )
    showToast('收款成功')
    form.value.operator_memo = ''
    await fetchData()
  } catch {
    // 错误由拦截器处理
  } finally {
    submitting.value = false
  }
}

const onClickLeft = () => {
  const hasBack = Boolean(window.history.state?.back)
  if (hasBack) { router.back(); return }
  router.replace('/home/order')
}

// ===== 滚动折叠 navbar =====
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

onMounted(() => {
  fetchData()
  pageRef.value?.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  pageRef.value?.removeEventListener('scroll', onScroll)
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div ref="pageRef" class="page">

    <!-- ===== Sticky Header ===== -->
    <div class="sticky-header">
      <div class="header-nav">
        <button class="back-btn" @click="onClickLeft">
          <van-icon name="arrow-left" size="20" />
        </button>
        <div class="header-title">订单收款</div>
        <div class="header-nav-remain" :class="{ visible: isCollapsed }">
          待收 ￥{{ formatMoney(remainingAmount) }}
        </div>
      </div>
      <div class="header-status" :class="{ collapsed: isCollapsed }">
        <template v-if="detail">
          <van-icon name="gold-coin-o" class="status-icon" />
          <div class="status-info">
            <div class="status-label">待收 <span class="status-amount">￥{{ formatMoney(remainingAmount) }}</span></div>
            <div class="status-sub">{{ detail.order_no }}</div>
          </div>
          <div class="status-pills">
            <div class="status-pill">
              <span class="pill-label">应付</span>
              <span class="pill-value">￥{{ formatMoney(detail.payable_amount) }}</span>
            </div>
            <div class="status-pill">
              <span class="pill-label">已付</span>
              <span class="pill-value pill-paid">￥{{ formatMoney(detail.paid_amount) }}</span>
            </div>
          </div>
        </template>
        <template v-else-if="loading">
          <div class="status-skeleton">
            <div class="skeleton-line skeleton-label" />
            <div class="skeleton-line skeleton-no" />
          </div>
        </template>
      </div>
    </div>

    <!-- ===== 加载中 ===== -->
    <div v-if="loading" class="loading-wrap">
      <van-loading size="28" color="#2563eb" vertical>加载中...</van-loading>
    </div>

    <template v-else-if="detail">
      <div class="content">

        <!-- 收款登记 -->
        <div class="card">
          <div class="card-header">
            <van-icon name="edit" class="card-icon" />
            <span class="card-title">收款登记</span>
          </div>

          <div class="form-row" @click="openMethodSheet">
            <span class="form-label">支付方式</span>
            <div class="form-value-row">
              <span :class="form.pay_method_label ? 'form-value' : 'form-placeholder'">
                {{ form.pay_method_label || '请选择' }}
              </span>
              <van-icon name="arrow" size="14" class="form-arrow" />
            </div>
          </div>

          <div class="form-row form-row--amount">
            <span class="form-label">收款金额</span>
            <div class="form-value-row">
              <span class="amount-prefix">￥</span>
              <input
                v-model="form.pay_amount"
                class="amount-input"
                type="number"
                inputmode="decimal"
                placeholder="0.00"
              />
            </div>
          </div>

          <div class="form-row form-row--last">
            <span class="form-label">备注</span>
            <input
              v-model="form.operator_memo"
              class="memo-input"
              placeholder="可填写收款备注（选填）"
            />
          </div>
        </div>

        <!-- 提交 -->
        <van-button
          block
          round
          type="primary"
          :loading="submitting"
          class="submit-btn"
          @click="onSubmit"
        >确认收款</van-button>

        <!-- 流水标题 -->
        <div class="section-head">
          <van-icon name="records-o" class="section-icon" />
          <span>支付流水</span>
          <span class="section-count">{{ payList.length }} 笔</span>
        </div>

        <!-- 流水列表 -->
        <van-empty v-if="!payList.length" description="暂无支付记录" />
        <div v-else class="pay-list">
          <div v-for="(item, idx) in payList" :key="idx" class="pay-card">
            <div class="pay-card-top">
              <span class="pay-amount">￥{{ formatMoney(item.pay_amount) }}</span>
              <span class="pay-badge">{{ item.pay_method_str || '-' }}</span>
            </div>
            <div class="pay-card-meta">
              <div class="meta-row">
                <van-icon name="clock-o" size="12" class="meta-icon" />
                <span>{{ item.operator_time_str || '-' }}</span>
              </div>
              <div class="meta-row">
                <van-icon name="manager-o" size="12" class="meta-icon" />
                <span>{{ item.operator_info || '-' }}</span>
              </div>
            </div>
            <div class="pay-ca-no">
              <van-icon name="label-o" size="11" class="meta-icon" />
              {{ item.ca_no || '-' }}
            </div>
            <div v-if="item.operator_memo" class="pay-card-memo">{{ item.operator_memo }}</div>
          </div>
        </div>

      </div>
    </template>

    <van-action-sheet
      v-model:show="showMethodSheet"
      :actions="payMethods"
      cancel-text="取消"
      @select="onSelectMethod"
    />
  </div>
</template>

<style scoped>
.page {
  --c-primary: #d97706;
  --c-primary-light: #fffbeb;
  --c-text: #111827;
  --c-sub: #6b7280;
  --c-muted: #9ca3af;
  --c-border: #e5e7eb;
  --c-bg: #f3f4f6;
  --c-card: #ffffff;
  --radius: 12px;
  --shadow: 0 1px 0 rgba(0, 0, 0, 0.06);

  height: 100vh;
  overflow-y: auto;
  background: var(--c-bg);
  padding-bottom: calc(32px + env(safe-area-inset-bottom));
}

/* ===== Sticky Header ===== */
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 100;
  padding-top: env(safe-area-inset-top);
  background: linear-gradient(135deg, #d97706, #f59e0b);
  overflow: hidden;
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
}

.header-nav-remain {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  padding-right: 4px;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.header-nav-remain.visible {
  opacity: 1;
  transform: translateY(0);
}

/* 展开区（待收金额 + 应付/已付） */
.header-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 16px 18px;
  position: relative;
  z-index: 1;
  max-height: 120px;
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
  font-size: 30px;
  color: rgba(255, 255, 255, 0.85);
  flex-shrink: 0;
}

.status-info {
  flex: 1;
  min-width: 0;
}

.status-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.status-amount {
  font-size: 22px;
  font-weight: 700;
  color: #fef08a;
  margin-left: 4px;
}

.status-sub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 3px;
  font-family: monospace;
}

.status-pills {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 999px;
  padding: 3px 10px;
}

.pill-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}

.pill-value {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.pill-paid {
  color: #86efac;
}

/* skeleton */
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

.skeleton-label { width: 120px; height: 18px; }
.skeleton-no    { width: 160px; height: 12px; }

@keyframes shimmer {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 0.8; }
}

/* ===== 内容区 ===== */
.loading-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px 0;
}

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
  padding: 14px 16px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.card-icon {
  font-size: 16px;
  color: var(--c-primary);
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--c-text);
}

/* ===== 表单行 ===== */
.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--c-border);
  gap: 12px;
  cursor: pointer;
}

.form-row--amount { cursor: default; }

.form-row--last {
  border-bottom: none;
  cursor: default;
  align-items: center;
  padding-bottom: 4px;
}

.form-label {
  font-size: 14px;
  color: var(--c-sub);
  flex-shrink: 0;
  width: 64px;
}

.form-value-row {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.form-value {
  font-size: 14px;
  color: var(--c-text);
  font-weight: 500;
}

.form-placeholder {
  font-size: 14px;
  color: var(--c-muted);
}

.form-arrow { color: var(--c-muted); }

.amount-prefix {
  font-size: 18px;
  font-weight: 700;
  color: var(--c-text);
}

.amount-input {
  border: none;
  outline: none;
  font-size: 22px;
  font-weight: 700;
  color: var(--c-text);
  text-align: right;
  width: 0;
  flex: 1;
  background: transparent;
  padding: 0;
}

.amount-input::placeholder {
  color: var(--c-muted);
  font-weight: 400;
  font-size: 18px;
}

.memo-input {
  border: none;
  outline: none;
  font-size: 14px;
  color: var(--c-text);
  text-align: right;
  flex: 1;
  background: transparent;
  padding: 0;
}

.memo-input::placeholder { color: var(--c-muted); }

/* ===== 提交按钮 ===== */
.submit-btn {
  height: 48px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  background: #d97706 !important;
  border-color: #d97706 !important;
}

/* ===== 流水标题 ===== */
.section-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 700;
  color: var(--c-text);
  padding: 4px 2px 0;
}

.section-icon {
  font-size: 16px;
  color: var(--c-primary);
}

.section-count {
  margin-left: auto;
  font-size: 12px;
  font-weight: 400;
  color: var(--c-muted);
}

/* ===== 流水卡片 ===== */
.pay-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pay-card {
  background: var(--c-card);
  border-radius: var(--radius);
  padding: 14px 16px;
  box-shadow: var(--shadow);
}

.pay-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.pay-amount {
  font-size: 22px;
  font-weight: 700;
  color: var(--c-text);
}

.pay-badge {
  font-size: 12px;
  font-weight: 500;
  color: #d97706;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 999px;
  padding: 2px 10px;
}

.pay-card-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--c-sub);
}

.meta-icon { color: var(--c-muted); flex-shrink: 0; }

.pay-ca-no {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--c-muted);
  font-family: monospace;
}

.pay-card-memo {
  margin-top: 10px;
  font-size: 12px;
  color: var(--c-sub);
  background: #fffbeb;
  border-radius: 6px;
  padding: 6px 10px;
  border-left: 3px solid #fde68a;
}
</style>
