<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { showToast, showImagePreview } from 'vant'
import { patternSearchByFilename, orderListByPattern } from '@/api/pattern_search'

const route = useRoute()
const filename = computed(() => route.query.filename || '')
const imageUrl = computed(() => route.query.url || '')
const scoreText = computed(() => route.query.score || '')

const patternInfo = ref(null)
const patternLoading = ref(false)

const orderLoading = ref(false)
const orderFinished = ref(false)
const orderPage = ref(1)
const orderPageSize = 10
const orders = ref([])
const orderTotal = ref(0)

const fetchPattern = async () => {
  if (!filename.value) {
    showToast('缺少图片信息')
    return
  }
  patternLoading.value = true
  try {
    const res = await patternSearchByFilename(filename.value, { loading: false })
    const data = res?.data || null
    if (!data) {
      showToast('未找到对应版式')
      patternInfo.value = null
      resetOrders()
      return
    }
    patternInfo.value = data
    resetOrders()
    await loadOrders(true)
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
  if (reset) {
    orderPage.value = 1
    orders.value = []
    orderFinished.value = false
  }
  if (orderFinished.value) return
  orderLoading.value = true
  try {
    const res = await orderListByPattern({
      page: orderPage.value,
      page_size: orderPageSize,
      pattern_code: patternInfo.value.code,
    }, { loading: false })
    const data = res?.data || {}
    const items = data.items || []
    orderTotal.value = data.total_count || 0
    if (!items.length) {
      orderFinished.value = true
      return
    }
    orders.value = orders.value.concat(items)
    if (orders.value.length >= orderTotal.value) {
      orderFinished.value = true
    } else {
      orderPage.value += 1
    }
  } finally {
    orderLoading.value = false
  }
}

const previewMain = () => {
  if (patternInfo.value?.main_image?.url) {
    showImagePreview([patternInfo.value.main_image.url])
  }
}

const previewSub = (index = 0) => {
  const urls = patternInfo.value?.images?.map((img) => img.url) || []
  if (urls.length) showImagePreview({ images: urls, startPosition: index })
}

onMounted(fetchPattern)
</script>

<template>
  <div class="page">
    <section class="hero">
      <div class="hero-title">搜索详情</div>
      <div class="hero-sub">匹配结果与关联订单信息</div>
    </section>

    <section class="card search-card">
      <div class="card-header">
        <span>本次匹配</span>
        <span class="muted">{{ scoreText || '--' }}</span>
      </div>
      <div class="card-body match-body">
        <van-image v-if="imageUrl" :src="imageUrl" width="96" height="96" fit="cover" radius="12" />
        <div class="match-info">
          <div class="match-name">{{ filename }}</div>
          <div class="match-tip">下方为版式与关联订单</div>
        </div>
      </div>
    </section>

    <section class="card pattern-card">
      <div class="card-header">
        <span>版式信息</span>
        <span v-if="patternInfo" class="status" :class="patternInfo.is_active ? 'active' : 'inactive'">
          {{ patternInfo.is_active ? '启用' : '停用' }}
        </span>
      </div>
      <div class="card-body" v-if="patternInfo" :class="{ loading: patternLoading }">
        <div class="pattern-main" @click="previewMain">
          <van-image
            v-if="patternInfo.main_image"
            :src="patternInfo.main_image.url"
            width="100%"
            height="180"
            fit="cover"
            radius="12"
          />
          <div v-else class="no-main">暂无主图</div>
        </div>
        <div class="pattern-info">
          <div class="row">
            <span class="label">版号</span>
            <span class="value code">{{ patternInfo.code }}</span>
          </div>
          <div class="row" v-if="patternInfo.tags?.length">
            <span class="label">标签</span>
            <div class="tags">
              <van-tag v-for="tag in patternInfo.tags" :key="tag" type="primary">{{ tag }}</van-tag>
            </div>
          </div>
          <div class="row" v-if="patternInfo.memo">
            <span class="label">备注</span>
            <span class="value">{{ patternInfo.memo }}</span>
          </div>
        </div>
        <div class="sub-images">
          <div class="sub-title">辅图 · {{ patternInfo.images?.length || 0 }} 张</div>
          <div v-if="patternInfo.images?.length" class="sub-list">
            <div
              v-for="(img, idx) in patternInfo.images"
              :key="img.rid || idx"
              class="sub-item"
              @click="previewSub(idx)"
            >
              <van-image :src="img.url" width="86" height="86" fit="cover" radius="10" />
            </div>
          </div>
          <div v-else class="empty">暂无辅图</div>
        </div>
      </div>
      <div v-else class="empty">暂无版式信息</div>
    </section>

    <section class="card order-card">
      <div class="card-header">
        <span>关联订单</span>
        <span class="muted">{{ orderTotal }} 条</span>
      </div>
      <div class="card-body">
        <div v-if="!patternInfo" class="empty">暂无关联订单</div>
        <van-list
          v-else
          v-model:loading="orderLoading"
          :finished="orderFinished"
          finished-text="没有更多了"
          @load="loadOrders"
        >
          <div v-if="!orders.length && !orderLoading" class="empty">暂无关联订单</div>
          <div v-for="order in orders" :key="order.pk" class="order-item">
            <div class="order-row">
              <span class="order-label">订单号</span>
              <span class="order-value">{{ order.order_no }}</span>
            </div>
            <div class="order-row">
              <span class="order-label">状态</span>
              <span class="order-value">{{ order.order_status_str || '-' }}</span>
            </div>
            <div class="order-row">
              <span class="order-label">收货人</span>
              <span class="order-value">{{ order.receiver_name || '-' }}</span>
            </div>
            <div class="order-row">
              <span class="order-label">电话</span>
              <span class="order-value">{{ order.receiver_phone || '-' }}</span>
            </div>
            <div class="order-row">
              <span class="order-label">应付</span>
              <span class="order-value">￥{{ order.payable_amount || 0 }}</span>
            </div>
            <div class="order-row">
              <span class="order-label">实付</span>
              <span class="order-value">￥{{ order.paid_amount || 0 }}</span>
            </div>
          </div>
        </van-list>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page {
  min-height: 100%;
  background: #f4f6fb;
  padding-bottom: 40px;
}

.hero {
  padding: 20px 16px 10px;
  background: radial-gradient(circle at 20% 0%, rgba(52, 211, 153, 0.35) 0%, rgba(52, 211, 153, 0) 45%),
    radial-gradient(circle at 90% 10%, rgba(59, 130, 246, 0.35) 0%, rgba(59, 130, 246, 0) 50%),
    linear-gradient(150deg, #ffffff 0%, #f1f5ff 75%, #ecf4ff 100%);
  border-radius: 0 0 22px 22px;
  box-shadow: 0 8px 24px rgba(31, 42, 68, 0.08);
}

.hero-title {
  font-size: 20px;
  font-weight: 800;
  color: #1f2a44;
}

.hero-sub {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(31, 42, 68, 0.65);
}

.card {
  margin: 14px 14px 0;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(31, 42, 68, 0.08);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 700;
  color: #1f2a44;
  background: #f7f9ff;
  border-bottom: 1px solid rgba(31, 42, 68, 0.06);
}

.card-body {
  padding: 12px 14px 14px;
}

.match-body {
  display: flex;
  gap: 12px;
  align-items: center;
}

.match-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.match-name {
  font-size: 12px;
  font-weight: 700;
  color: #1f2a44;
  word-break: break-all;
}

.match-tip {
  font-size: 11px;
  color: rgba(31, 42, 68, 0.55);
}

.muted {
  font-size: 11px;
  color: rgba(31, 42, 68, 0.5);
}

.pattern-main {
  margin-bottom: 10px;
}

.no-main {
  height: 180px;
  border-radius: 12px;
  background: #f2f4f8;
  color: rgba(31, 42, 68, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.pattern-info {
  display: grid;
  gap: 8px;
}

.row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 12px;
}

.label {
  width: 36px;
  color: rgba(31, 42, 68, 0.55);
  flex-shrink: 0;
}

.value {
  color: #1f2a44;
  flex: 1;
  word-break: break-all;
}

.value.code {
  font-weight: 700;
  letter-spacing: 0.4px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.sub-images {
  margin-top: 12px;
}

.sub-title {
  font-size: 12px;
  color: rgba(31, 42, 68, 0.55);
  margin-bottom: 8px;
}

.sub-list {
  display: flex;
  gap: 10px;
  overflow-x: auto;
}

.sub-item {
  flex-shrink: 0;
}

.status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
}

.status.active {
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
}

.status.inactive {
  background: rgba(248, 113, 113, 0.15);
  color: #ef4444;
}

.order-item {
  padding: 12px;
  border-radius: 12px;
  background: #f9fafc;
  border: 1px solid rgba(31, 42, 68, 0.06);
  margin-bottom: 10px;
}

.order-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  padding: 3px 0;
}

.order-label {
  color: rgba(31, 42, 68, 0.5);
}

.order-value {
  color: #1f2a44;
  font-weight: 600;
}

.empty {
  font-size: 12px;
  color: rgba(31, 42, 68, 0.5);
  text-align: center;
  padding: 14px 0;
}
</style>
