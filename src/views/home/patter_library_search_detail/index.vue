<script setup>
defineOptions({ name: 'HomePatterLibrarySearchDetail' })

import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showImagePreview } from 'vant'
import { patternSearchByFilename, orderListByPattern } from '@/api/pattern_search'

const route = useRoute()
const router = useRouter()

const filename = computed(() => route.query.filename || '')
const imageUrl = computed(() => route.query.url || '')
const scoreText = computed(() => route.query.score || '')

const patternInfo = ref(null)
const patternLoading = ref(false)
const loadError = ref(false)

const orderLoading = ref(false)
const orderFinished = ref(false)
const orderPage = ref(1)
const orderPageSize = 10
const orders = ref([])
const orderTotal = ref(0)

const onClickLeft = () => {
  const hasBack = Boolean(window.history.state?.back)
  if (hasBack) { router.back(); return }
  router.replace('/home/patter-library-search')
}

const goPatternDetail = () => {
  if (!patternInfo.value?.id) return
  router.push({
    path: '/home/pattern-library/detail',
    query: { pattern_id: patternInfo.value.id, code: patternInfo.value.code },
  })
}

const goOrderDetail = (order) => {
  if (!order?.pk) return
  router.push({
    path: '/home/order/detail',
    query: { id: order.pk, order_status: order.order_status },
  })
}

const fetchPattern = async () => {
  if (!filename.value) { showToast('缺少图片信息'); return }
  patternLoading.value = true
  loadError.value = false
  try {
    const res = await patternSearchByFilename(filename.value, { loading: false })
    const data = res?.data || null
    if (!data) { showToast('未找到对应版式'); patternInfo.value = null; resetOrders(); return }
    patternInfo.value = data
    resetOrders()
    await loadOrders(true)
  } catch {
    loadError.value = true
  } finally {
    patternLoading.value = false
  }
}

const resetOrders = () => {
  orders.value = []
  orderTotal.value = 0
  orderPage.value = 1
  orderFinished.value = false
}

const loadOrders = async (reset = false) => {
  if (!patternInfo.value?.code) return
  if (reset) { orderPage.value = 1; orders.value = []; orderFinished.value = false }
  if (orderFinished.value) return
  orderLoading.value = true
  try {
    const res = await orderListByPattern(
      { page: orderPage.value, page_size: orderPageSize, pattern_code: patternInfo.value.code },
      { loading: false },
    )
    const data = res?.data || {}
    const items = data.items || []
    orderTotal.value = data.total_count || 0
    orders.value = orders.value.concat(items)
    if (!items.length || orders.value.length >= orderTotal.value) {
      orderFinished.value = true
    } else {
      orderPage.value += 1
    }
  } finally {
    orderLoading.value = false
  }
}

const previewMain = () => {
  if (patternInfo.value?.main_image?.url) showImagePreview([patternInfo.value.main_image.url])
}

const previewSub = (index = 0) => {
  const urls = patternInfo.value?.images?.map((img) => img.url) || []
  if (urls.length) showImagePreview({ images: urls, startPosition: index })
}

const scoreLevelClass = (score) => {
  const v = parseFloat(score)
  if (isNaN(v)) return 'score-unknown'
  if (v >= 85) return 'score-high'
  if (v >= 65) return 'score-mid'
  return 'score-low'
}

onMounted(fetchPattern)
</script>

<template>
  <div class="page">
    <!-- sticky header -->
    <header class="sticky-header">
      <div class="header-nav">
        <button class="back-btn" @click="onClickLeft">
          <van-icon name="arrow-left" size="20" />
        </button>
        <div class="header-title">版式搜索详情</div>
        <div class="header-right">
          <span v-if="scoreText" class="score-badge" :class="scoreLevelClass(parseFloat(scoreText))">
            相似度 {{ scoreText }}
          </span>
        </div>
      </div>
      <div class="header-sub">
        <van-icon name="photo-o" class="sub-icon" />
        <span class="sub-text">{{ filename || '匹配结果与关联订单信息' }}</span>
      </div>
    </header>

    <div class="content">
      <!-- 本次匹配 -->
      <section class="card">
        <div class="card-header">
          <div class="card-title-wrap">
            <van-icon name="search" size="15" class="card-icon" />
            <span class="card-title">本次匹配</span>
          </div>
        </div>
        <div class="card-body match-body">
          <van-image
            v-if="imageUrl"
            :src="imageUrl"
            width="80"
            height="80"
            fit="cover"
            radius="10"
            class="match-img"
          />
          <div v-else class="match-img-placeholder">
            <van-icon name="photo-o" size="24" color="#cbd5e1" />
          </div>
          <div class="match-info">
            <div class="match-name">{{ filename || '-' }}</div>
            <div class="match-tip">搜索图片文件名</div>
          </div>
        </div>
      </section>

      <!-- 版式信息 -->
      <section class="card">
        <div class="card-header" @click="goPatternDetail" style="cursor:pointer">
          <div class="card-title-wrap">
            <van-icon name="records-o" size="15" class="card-icon" />
            <span class="card-title">版式信息</span>
          </div>
          <div class="card-header-right">
            <span
              v-if="patternInfo"
              class="status-tag"
              :class="patternInfo.is_active ? 'tag-active' : 'tag-inactive'"
            >
              {{ patternInfo.is_active ? '启用' : '停用' }}
            </span>
            <van-icon v-if="patternInfo" name="arrow" size="13" color="#9ca3af" />
          </div>
        </div>

        <div v-if="patternLoading" class="card-body loading-wrap">
          <van-loading size="24" color="#2563eb" vertical>加载中...</van-loading>
        </div>

        <div v-else-if="!patternInfo" class="card-body">
          <van-empty description="未找到版式信息" />
        </div>

        <div v-else class="card-body">
          <!-- 主图 -->
          <div class="main-img-wrap" @click="previewMain">
            <van-image
              v-if="patternInfo.main_image?.url"
              :src="patternInfo.main_image.url"
              width="100%"
              height="200"
              fit="cover"
              radius="10"
            />
            <div v-else class="no-main">
              <van-icon name="photo-o" size="28" color="#cbd5e1" />
              <span>暂无主图</span>
            </div>
            <div v-if="patternInfo.main_image?.url" class="preview-hint">
              <van-icon name="eye-o" size="12" />
              <span>点击预览</span>
            </div>
          </div>

          <!-- 基本信息 -->
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">版号</span>
              <span class="info-value code">{{ patternInfo.code || '-' }}</span>
            </div>
            <div v-if="patternInfo.memo" class="info-row">
              <span class="info-label">备注</span>
              <span class="info-value">{{ patternInfo.memo }}</span>
            </div>
            <div v-if="patternInfo.tags?.length" class="info-row">
              <span class="info-label">标签</span>
              <div class="tag-list">
                <span v-for="tag in patternInfo.tags" :key="tag" class="tag-item">{{ tag }}</span>
              </div>
            </div>
          </div>

          <!-- 辅图 -->
          <div v-if="patternInfo.images?.length" class="sub-section">
            <div class="sub-header">
              <span class="sub-label">辅图</span>
              <span class="sub-count">{{ patternInfo.images.length }} 张</span>
            </div>
            <div class="sub-list">
              <div
                v-for="(img, idx) in patternInfo.images"
                :key="img.rid || idx"
                class="sub-item"
                @click="previewSub(idx)"
              >
                <van-image :src="img.url" width="80" height="80" fit="cover" radius="8" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 关联订单 -->
      <section class="card">
        <div class="card-header">
          <div class="card-title-wrap">
            <van-icon name="orders-o" size="15" class="card-icon" />
            <span class="card-title">关联订单</span>
          </div>
          <span class="card-desc">{{ orderTotal }} 条</span>
        </div>
        <div class="card-body">
          <div v-if="!patternInfo && !patternLoading">
            <van-empty description="暂无关联订单" />
          </div>
          <van-list
            v-else
            v-model:loading="orderLoading"
            :finished="orderFinished"
            finished-text="没有更多了"
            @load="loadOrders"
          >
            <van-empty v-if="!orders.length && !orderLoading" description="暂无关联订单" />
            <div
              v-for="order in orders"
              :key="order.pk"
              class="order-card"
              @click="goOrderDetail(order)"
            >
              <div class="order-top">
                <span class="order-no">{{ order.receiver_company || order.order_no }}</span>
                <span class="order-status-tag">{{ order.order_status_str || '-' }}</span>
              </div>
              <div class="order-meta">
                <span class="order-meta-item">
                  <van-icon name="phone-o" size="11" />
                  {{ order.receiver_phone || '-' }}
                </span>
                <span class="order-meta-item">
                  <van-icon name="location-o" size="11" />
                  {{ order.receiver_name || '-' }}
                </span>
              </div>
              <div class="order-footer">
                <span class="order-no-text">{{ order.order_no }}</span>
                <span class="order-amount">￥{{ order.payable_amount || 0 }}</span>
              </div>
            </div>
          </van-list>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page {
  height: 100vh;
  overflow-y: auto;
  background: #f3f4f6;
  padding-bottom: 24px;
}

/* header */
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 22;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  padding-top: env(safe-area-inset-top);
  overflow: hidden;
}

.sticky-header::after {
  content: '';
  position: absolute;
  right: -24px;
  top: -22px;
  width: 132px;
  height: 132px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.11);
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
  display: inline-flex;
  align-items: center;
}

.score-badge {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

.score-badge.score-high {
  background: rgba(255,255,255,0.22);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.3);
}

.score-badge.score-mid {
  background: rgba(255,255,255,0.18);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.25);
}

.score-badge.score-low {
  background: rgba(255,200,100,0.25);
  color: #fff;
  border: 1px solid rgba(255,200,100,0.35);
}

.score-badge.score-unknown {
  background: rgba(255,255,255,0.14);
  color: rgba(255,255,255,0.8);
  border: 1px solid rgba(255,255,255,0.2);
}

.header-sub {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 16px 12px;
  position: relative;
  z-index: 1;
}

.sub-icon {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
}

.sub-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* content */
.content {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef0f4;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 12px 10px;
  border-bottom: 1px solid #f3f4f6;
}

.card-title-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.card-icon {
  color: #2563eb;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.card-desc {
  font-size: 12px;
  color: #6b7280;
}

.card-body {
  padding: 12px;
}

/* match */
.match-body {
  display: flex;
  align-items: center;
  gap: 12px;
}

.match-img {
  flex-shrink: 0;
  border-radius: 10px;
  overflow: hidden;
}

.match-img-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 10px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.match-info {
  min-width: 0;
  flex: 1;
}

.match-name {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  word-break: break-all;
  line-height: 1.4;
}

.match-tip {
  margin-top: 4px;
  font-size: 11px;
  color: #9ca3af;
}

/* status tag */
.status-tag {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 999px;
}

.tag-active {
  background: #d1fae5;
  color: #065f46;
}

.tag-inactive {
  background: #fee2e2;
  color: #991b1b;
}

/* main image */
.main-img-wrap {
  position: relative;
  margin-bottom: 12px;
  cursor: pointer;
}

.no-main {
  height: 180px;
  border-radius: 10px;
  background: #f3f4f6;
  border: 1px dashed #d1d5db;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  color: #9ca3af;
}

.preview-hint {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(0,0,0,0.45);
  color: #fff;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 999px;
}

/* info grid */
.info-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 10px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
}

.info-label {
  width: 36px;
  color: #6b7280;
  flex-shrink: 0;
}

.info-value {
  flex: 1;
  color: #111827;
  word-break: break-all;
}

.info-value.code {
  font-weight: 700;
  letter-spacing: 0.4px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-item {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
}

/* sub images */
.sub-section {
  margin-top: 12px;
}

.sub-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.sub-label {
  font-size: 12px;
  color: #6b7280;
}

.sub-count {
  font-size: 11px;
  color: #9ca3af;
}

.sub-list {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.sub-item {
  flex-shrink: 0;
  cursor: pointer;
}

/* loading */
.loading-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 0;
}

/* card-header-right */
.card-header-right {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* order */
.order-card {
  border: 1px solid #eef0f4;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 8px;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.order-card:active {
  transform: scale(0.986);
}

.order-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 6px;
}

.order-no {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.order-status-tag {
  font-size: 11px;
  color: #2563eb;
  background: #eff6ff;
  padding: 2px 8px;
  border-radius: 999px;
  flex-shrink: 0;
  margin-left: 8px;
}

.order-meta {
  display: flex;
  gap: 12px;
  padding: 4px 12px;
}

.order-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}

.order-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px 10px;
  border-top: 1px solid #f3f4f6;
  margin-top: 4px;
}

.order-no-text {
  font-size: 11px;
  color: #9ca3af;
}

.order-amount {
  font-size: 14px;
  font-weight: 700;
  color: #2563eb;
}
</style>
