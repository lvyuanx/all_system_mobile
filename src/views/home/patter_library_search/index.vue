<script setup>
defineOptions({ name: 'HomePatterLibrarySearch' })

import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { imageSearch, imageSearchQuota } from '@/api/pattern_search'

const route = useRoute()
const router = useRouter()

const quota = ref(null)
const searching = ref(false)
const imageFileList = ref([])
const searchImageFile = ref(null)
const searched = ref(false)

const results = ref([])
const pageRef = ref(null)
const isCollapsed = ref(false)
let lastScrollTop = 0
let rafId = null
const THRESHOLD = 8

const navTitle = computed(() => route.query.name || '版式搜索')

const quotaBadgeText = computed(() => {
  if (quota.value === -1) return '不限次数'
  if (quota.value === null) return '配额未知'
  if (quota.value <= 0) return '次数不足'
  return `剩余 ${quota.value} 次`
})

const quotaBadgeClass = computed(() => {
  if (quota.value === -1) return 'quota-vip'
  if (quota.value === null) return 'quota-unknown'
  if (quota.value <= 0) return 'quota-danger'
  return 'quota-normal'
})

const uploadHint = computed(() => {
  if (!searchImageFile.value) return '建议上传清晰主图，匹配结果更准确'
  return `当前图片：${searchImageFile.value.name || '已上传'}`
})

const headerSubText = computed(() => {
  if (searching.value) return '正在检索图片，请稍候...'
  if (searchImageFile.value?.name) return `当前图片：${searchImageFile.value.name}`
  return '上传图片后可快速检索'
})

const canSearch = computed(() => {
  if (!searchImageFile.value) return false
  if (quota.value === null || quota.value === -1) return true
  return quota.value > 0
})

const formatScore = (score) => {
  if (typeof score !== 'number') return '--'
  return `${(score * 100).toFixed(2)}%`
}

const loadQuota = async () => {
  try {
    const res = await imageSearchQuota({ loading: false })
    quota.value = typeof res?.data === 'number' ? res.data : res
  } catch {
    quota.value = null
  }
}

const onImageRead = ({ file }) => {
  searchImageFile.value = file
}

const onImageDelete = () => {
  searchImageFile.value = null
}

const onSearch = async () => {
  if (!searchImageFile.value) {
    showToast('请先上传图片')
    return
  }
  if (!(quota.value === -1 || quota.value === null || quota.value > 0)) {
    showToast('剩余次数不足')
    return
  }

  searching.value = true
  searched.value = true
  try {
    const res = await imageSearch(searchImageFile.value, { loading: false })
    const list = Array.isArray(res?.data) ? res.data : []
    results.value = list.map((item) => ({
      ...item,
      scoreText: formatScore(item.score),
    }))
  } catch {
    results.value = []
  } finally {
    searching.value = false
    await loadQuota()
  }
}

const onClear = () => {
  imageFileList.value = []
  searchImageFile.value = null
  results.value = []
  searched.value = false
}

const onSelectResult = (item) => {
  const filename = item?.original_name || item?.stored_name
  if (!filename) {
    showToast('缺少图片信息')
    return
  }
  router.push({
    path: '/home/patter-library-search-detail',
    query: {
      filename,
      url: item.url,
      score: item.scoreText || '',
    },
  })
}

const scoreLevelClass = (score) => {
  const value = Number(score)
  if (Number.isNaN(value)) return 'score-unknown'
  if (value >= 0.85) return 'score-high'
  if (value >= 0.65) return 'score-mid'
  return 'score-low'
}

const onClickLeft = () => {
  const hasBack = Boolean(window.history.state?.back)
  if (hasBack) {
    router.back()
    return
  }
  router.replace('/home')
}

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
  loadQuota()
  pageRef.value?.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  pageRef.value?.removeEventListener('scroll', onScroll)
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div ref="pageRef" class="page">
    <header class="sticky-header status-search">
      <div class="header-nav">
        <button class="back-btn" @click="onClickLeft">
          <van-icon name="arrow-left" size="20" />
        </button>
        <div class="header-title">{{ navTitle }}</div>
        <div class="header-right">
          <span class="header-quota" :class="quotaBadgeClass">{{ quotaBadgeText }}</span>
        </div>
      </div>

      <div class="header-status" :class="{ collapsed: isCollapsed }">
        <van-icon name="photo-o" class="status-icon" />
        <div class="status-sub">{{ headerSubText }}</div>
      </div>
    </header>

    <div class="content">
      <section class="card">
        <div class="card-header">
          <div class="card-title-wrap">
            <van-icon name="photo-o" size="15" class="card-icon" />
            <span class="card-title">搜索图片</span>
          </div>
          <span class="card-desc">支持单张上传</span>
        </div>
        <div class="card-body search-body">
          <van-uploader
            v-model="imageFileList"
            class="search-uploader"
            :max-count="1"
            accept="image/*"
            :after-read="onImageRead"
            @delete="onImageDelete"
          />
          <div class="upload-hint">
            <span class="hint-dot" />
            <span class="hint-text">{{ uploadHint }}</span>
          </div>

          <div class="search-actions">
            <button
              type="button"
              class="panel-btn panel-btn-primary"
              :class="{ disabled: !canSearch || searching }"
              :disabled="!canSearch || searching"
              @click="onSearch"
            >
              <van-loading v-if="searching" size="14" color="#fff" class="btn-loading" />
              <span>{{ searching ? '搜索中' : '开始搜索' }}</span>
            </button>
            <button type="button" class="panel-btn panel-btn-ghost" @click="onClear">清空</button>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-header">
          <div class="card-title-wrap">
            <van-icon name="records-o" size="15" class="card-icon" />
            <span class="card-title">搜索结果</span>
          </div>
          <span class="card-desc">{{ results.length }} 条</span>
        </div>
        <div class="card-body">
          <div v-if="searching" class="loading-wrap">
            <van-loading size="26" color="#2563eb" vertical>正在检索图片...</van-loading>
          </div>
          <div v-else-if="!results.length" class="empty-wrap">
            <van-empty :description="searched ? '未找到匹配结果，请更换图片重试' : '请先上传图片并点击搜索'" />
          </div>
          <div v-else class="result-list">
            <article
              v-for="(item, index) in results"
              :key="item.stored_name || `${item.url}-${index}`"
              class="result-item"
              @click="onSelectResult(item)"
            >
              <div class="thumb-wrap">
                <van-image
                  v-if="item.url"
                  :src="item.url"
                  width="84"
                  height="84"
                  fit="cover"
                  class="result-img"
                />
                <div v-else class="thumb-placeholder">
                  <van-icon name="photo-o" size="20" color="#cbd5e1" />
                </div>
                <span class="thumb-index">{{ index + 1 }}</span>
              </div>

              <div class="result-info">
                <div class="result-top">
                  <span class="result-score" :class="scoreLevelClass(item.score)">相似度 {{ item.scoreText }}</span>
                  <span class="result-arrow">
                    <van-icon name="arrow" size="12" />
                  </span>
                </div>
                <div class="result-name">{{ item.original_name || item.stored_name || '-' }}</div>
                <div class="result-foot">
                  <button type="button" class="action-btn" @click.stop="onSelectResult(item)">查看详情</button>
                </div>
              </div>
            </article>
          </div>
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
  padding-bottom: 20px;
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 22;
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

.header-quota {
  font-size: 11px;
  line-height: 1;
  padding: 5px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.32);
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  white-space: nowrap;
}

.header-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 16px 12px;
  position: relative;
  z-index: 1;
  max-height: 60px;
  opacity: 1;
  overflow: hidden;
  transition: max-height 0.28s ease, opacity 0.22s ease, padding 0.28s ease;
}

.header-status.collapsed {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.status-icon {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.88);
  flex-shrink: 0;
}

.status-sub {
  min-width: 0;
  flex: 1;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.76);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-search {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
}

.header-quota.quota-vip {
  color: #064e3b;
  border-color: rgba(16, 185, 129, 0.3);
  background: #d1fae5;
}

.header-quota.quota-normal {
  color: #1d4ed8;
  border-color: #bfdbfe;
  background: #eff6ff;
}

.header-quota.quota-danger {
  color: #b91c1c;
  border-color: #fecaca;
  background: #fef2f2;
}

.header-quota.quota-unknown {
  color: #334155;
  border-color: #cbd5e1;
  background: #f8fafc;
}

.content {
  padding: 10px;
}

.card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef0f4;
  overflow: hidden;
}

.card + .card {
  margin-top: 10px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 12px 10px;
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  border-bottom: 1px solid #f3f4f6;
  background: #fff;
}

.card-title-wrap {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.card-icon {
  color: #2563eb;
}

.card-title {
  font-size: 14px;
}

.card-desc {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.card-body {
  padding: 12px;
}

.search-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-uploader :deep(.van-uploader__wrapper) {
  gap: 10px;
}

.search-uploader :deep(.van-uploader__preview) {
  margin: 0;
}

.search-uploader :deep(.van-uploader__preview-image),
.search-uploader :deep(.van-uploader__upload) {
  width: 88px !important;
  height: 88px !important;
  border-radius: 10px;
  overflow: hidden;
}

.search-uploader :deep(.van-uploader__upload) {
  border: 1px dashed #d1d5db;
  background: #f9fafb;
}

.upload-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 8px;
  padding: 8px 10px;
  background: #f8fafc;
}

.hint-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #60a5fa;
  flex-shrink: 0;
}

.hint-text {
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
}

.search-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.panel-btn {
  border: 0;
  height: 40px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
}

.panel-btn-primary {
  color: #fff;
  background: var(--color-primary);
}

.panel-btn-primary.disabled {
  background: #bfdbfe;
  cursor: not-allowed;
}

.panel-btn-ghost {
  background: color-mix(in srgb, var(--color-primary) 10%, #ffffff);
  color: var(--color-primary);
}

.btn-loading {
  line-height: 1;
}

.loading-wrap {
  padding: 24px 0;
}

.empty-wrap {
  padding: 8px 0;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #edf0f5;
  background: #fff;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.result-item:active {
  transform: scale(0.986);
}

.thumb-wrap {
  position: relative;
  flex-shrink: 0;
}

.result-img {
  border-radius: 8px;
  overflow: hidden;
  background: #f3f4f6;
}

.thumb-placeholder {
  width: 84px;
  height: 84px;
  border-radius: 8px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-index {
  position: absolute;
  left: 6px;
  top: 6px;
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  border-radius: 999px;
  font-size: 11px;
  color: #fff;
  background: rgba(15, 23, 42, 0.66);
  padding: 0 4px;
}

.result-info {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.result-score {
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  border-radius: 999px;
  padding: 5px 9px;
}

.result-score.score-high {
  color: #0369a1;
  background: #e0f2fe;
}

.result-score.score-mid {
  color: #0f766e;
  background: #ccfbf1;
}

.result-score.score-low {
  color: #9a3412;
  background: #ffedd5;
}

.result-score.score-unknown {
  color: #475569;
  background: #f1f5f9;
}

.result-arrow {
  color: #94a3b8;
  flex-shrink: 0;
}

.result-name {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
  word-break: break-all;
}

.result-foot {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #475569;
  font-size: 12px;
  border-radius: 999px;
  height: 28px;
  padding: 0 12px;
  cursor: pointer;
}

.action-btn:active {
  opacity: 0.86;
}

@media (max-width: 360px) {
  .content {
    padding: 8px;
  }

  .panel-btn {
    font-size: 14px;
  }

  .header-title {
    font-size: 16px;
  }
}
</style>
