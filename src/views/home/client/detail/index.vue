<script setup>
defineOptions({ name: 'ClientDetail' })

import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getClientInfo } from '@/api/client'
import { formatMoney } from '@/utils/orderConstants'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const permCodes = computed(() =>
  (userStore.permPacks || []).map((p) => p.pack_code || p.packCode).filter(Boolean),
)
const canViewAmount = computed(
  () => userStore.userInfo?.is_superuser || permCodes.value.includes('FINANCE_MANAGE'),
)

const clientId = computed(() => Number(route.query.client_id || route.query.id || 0))

const detail = ref(null)
const loading = ref(false)
const loadError = ref(false)

const fetchDetail = async () => {
  if (!clientId.value) {
    showToast('缺少客户信息')
    router.back()
    return
  }
  loading.value = true
  loadError.value = false
  try {
    const res = await getClientInfo(clientId.value, { loading: false })
    detail.value = res?.data || null
  } catch {
    detail.value = null
    loadError.value = true
    // 错误由拦截器处理
  } finally {
    loading.value = false
  }
}

const onClickLeft = () => {
  const hasBack = Boolean(window.history.state?.back)
  if (hasBack) { router.back(); return }
  router.replace('/home/client')
}

const clientInitial = computed(() => {
  const name = detail.value?.client_name || ''
  return name ? name.slice(0, 1) : '客'
})

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

    <!-- ===== Sticky Header ===== -->
    <div class="sticky-header">
      <div class="header-nav">
        <button class="back-btn" @click="onClickLeft">
          <van-icon name="arrow-left" size="20" />
        </button>
        <div class="header-title">客户详情</div>
        <div class="header-nav-name" :class="{ visible: isCollapsed }">
          {{ detail?.client_name || '' }}
        </div>
      </div>
      <div class="header-status" :class="{ collapsed: isCollapsed }">
        <template v-if="detail">
          <div class="avatar-wrap">
            <img v-if="detail.company_logo" :src="detail.company_logo" class="header-logo" alt="" />
            <div v-else class="header-avatar">{{ clientInitial }}</div>
          </div>
          <div class="header-info">
            <div class="header-client-name">{{ detail.client_name || '-' }}</div>
            <div class="header-company">{{ detail.company_name || '—' }}</div>
            <div class="header-phone">
              <van-icon name="phone-o" size="12" />
              {{ detail.client_phone || '-' }}
            </div>
          </div>
          <div class="header-pills" v-if="canViewAmount">
            <div class="header-pill">
              <span class="pill-label">消费</span>
              <span class="pill-value">￥{{ formatMoney(detail.total_amount) }}</span>
            </div>
            <div class="header-pill pill-arrears">
              <span class="pill-label">欠款</span>
              <span class="pill-value pill-val-arrears">￥{{ formatMoney(detail.total_arrears) }}</span>
            </div>
          </div>
        </template>
        <template v-else-if="loading">
          <div class="status-skeleton">
            <div class="skeleton-line skeleton-name" />
            <div class="skeleton-line skeleton-sub" />
          </div>
        </template>
      </div>
    </div>

    <!-- ===== 加载中 ===== -->
    <div v-if="loading" class="full-center">
      <van-loading size="28" color="#2563eb" vertical>加载中...</van-loading>
    </div>

    <div v-else-if="detail" class="content">
      <div class="card" v-if="canViewAmount">
        <div class="card-header">
          <van-icon name="bill-o" class="card-icon" />
          <span class="card-title">交易概览</span>
        </div>
        <div class="amount-row">
          <div class="amount-item">
            <span class="amount-label">累计消费</span>
            <span class="amount-value is-payable">￥{{ formatMoney(detail.total_amount) }}</span>
          </div>
          <div class="amount-divider" />
          <div class="amount-item">
            <span class="amount-label">累计欠款</span>
            <span class="amount-value is-arrears">￥{{ formatMoney(detail.total_arrears) }}</span>
          </div>
        </div>
        <div class="amount-meta">
          <span>订单 {{ detail.total_order_count || 0 }}</span>
          <span class="dot-sep">·</span>
          <span>已结 {{ detail.total_end_order_count || 0 }}</span>
          <span class="dot-sep">·</span>
          <span>未结 {{ detail.unfinished_order_total || 0 }}</span>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <van-icon name="contact" class="card-icon" />
          <span class="card-title">客户信息</span>
        </div>
        <div class="info-list">
          <div class="info-row">
            <span class="info-key">客户姓名</span>
            <span class="info-val">{{ detail.client_name || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-key">性别</span>
            <span class="info-val">{{ detail.client_sex_str || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-key">年龄</span>
            <span class="info-val">{{ detail.client_age || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-key">手机号</span>
            <span class="info-val">{{ detail.client_phone || '-' }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <van-icon name="shop-o" class="card-icon" />
          <span class="card-title">公司信息</span>
        </div>
        <div class="info-list">
          <div class="info-row">
            <span class="info-key">公司名称</span>
            <span class="info-val">{{ detail.company_name || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-key">公司电话</span>
            <span class="info-val">{{ detail.company_phone || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-key">所属站点</span>
            <span class="info-val">{{ detail.site_names?.length ? detail.site_names.join('、') : '-' }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <van-icon name="location-o" class="card-icon" />
          <span class="card-title">联系地址</span>
        </div>
        <div class="info-list">
          <div class="info-row">
            <span class="info-key">地址</span>
            <span class="info-val">{{ detail.full_address || '-' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="loadError" class="state-wrap">
      <van-empty image="error" description="加载失败" />
    </div>
  </div>
</template>

<style scoped>
.page {
  --c-primary: #2563eb;
  --c-danger: #dc2626;
  --c-arrears: #f59e0b;
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
  background: linear-gradient(140deg, #1d4ed8, #2563eb 50%, #3b82f6 100%);
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
  background: rgba(255, 255, 255, 0.08);
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

.header-nav-name {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  padding-right: 4px;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.25s ease, transform 0.25s ease;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-nav-name.visible {
  opacity: 1;
  transform: translateY(0);
}

/* 展开区 */
.header-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 16px 18px;
  position: relative;
  z-index: 1;
  max-height: 130px;
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

.avatar-wrap {
  flex-shrink: 0;
}

.header-logo {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.header-avatar {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}

.header-info {
  flex: 1;
  min-width: 0;
}

.header-client-name {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-company {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-phone {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
}

.header-pills {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.header-pill {
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

.pill-val-arrears {
  color: #fde68a;
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

.skeleton-name { width: 120px; height: 18px; }
.skeleton-sub  { width: 160px; height: 12px; }

@keyframes shimmer {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 0.8; }
}

/* ===== 内容区 ===== */
.full-center {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px 0;
}

.content {
  padding: 12px 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.state-wrap {
  padding: 60px 0;
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

/* ===== 交易概览 ===== */
.amount-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
}

.amount-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.amount-label {
  font-size: 12px;
  color: var(--c-sub);
}

.amount-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--c-text);
}

.amount-divider {
  width: 1px;
  height: 32px;
  background: var(--c-border);
}

.amount-meta {
  margin-top: 10px;
  font-size: 12px;
  color: var(--c-sub);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.dot-sep {
  color: var(--c-muted);
}

.is-payable {
  color: var(--c-danger);
}

.is-arrears {
  color: var(--c-arrears);
}

/* ===== 信息列表 ===== */
.info-list {
  display: flex;
  flex-direction: column;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--c-border);
  gap: 10px;
}

.info-row:last-child {
  border-bottom: none;
}

.info-key {
  font-size: 14px;
  color: var(--c-sub);
  flex-shrink: 0;
}

.info-val {
  font-size: 14px;
  color: var(--c-text);
  text-align: right;
  max-width: 60%;
  word-break: break-all;
}
</style>
