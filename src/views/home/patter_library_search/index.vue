<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { imageSearch, imageSearchQuota } from '@/api/pattern_search'

const router = useRouter()

const quota = ref(null)
const searching = ref(false)
const imageFileList = ref([])
const searchImageFile = ref(null)

const results = ref([])

const quotaText = computed(() => {
  if (quota.value === -1) return 'VIP'
  if (quota.value === null) return '--'
  return `剩余次数：${quota.value}`
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
  try {
    const res = await imageSearch(searchImageFile.value, { loading: false })
    const list = res?.data || []
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
}

const onSelectResult = (item) => {
  if (!item?.original_name) {
    showToast('缺少图片信息')
    return
  }
  router.push({
    path: '/home/patter-library-search-detail',
    query: {
      filename: item.original_name,
      url: item.url,
      score: item.scoreText || '',
    },
  })
}

onMounted(loadQuota)
</script>

<template>
  <div class="page">
    <section class="hero">
      <div class="hero-title">以图搜版式</div>
      <div class="hero-sub">上传图片，快速匹配相关版式与关联订单</div>
    </section>

    <section class="card search-card">
      <div class="card-header">
        <span>图片搜索</span>
        <span class="quota">{{ quotaText }}</span>
      </div>
      <div class="card-body">
        <van-uploader
          v-model="imageFileList"
          :max-count="1"
          accept="image/*"
          :after-read="onImageRead"
          @delete="onImageDelete"
        />
        <div class="search-actions">
          <van-button
            type="primary"
            :loading="searching"
            loading-text="搜索中"
            :disabled="!canSearch"
            @click="onSearch"
          >
            搜索
          </van-button>
          <van-button plain type="default" @click="onClear">清空</van-button>
        </div>
      </div>
    </section>

    <section class="card result-card">
      <div class="card-header">
        <span>搜索结果</span>
        <span class="muted">{{ results.length }} 条</span>
      </div>
      <div class="card-body">
        <div v-if="!results.length" class="empty">暂无结果，请先上传图片搜索</div>
        <div v-else class="result-list">
          <div v-for="item in results" :key="item.stored_name" class="result-item">
            <van-image :src="item.url" width="86" height="86" fit="cover" class="result-img" />
            <div class="result-info">
              <div class="result-score">相似度 {{ item.scoreText }}</div>
              <div class="result-name">{{ item.original_name }}</div>
              <van-button size="small" type="primary" @click="onSelectResult(item)">查看详情</van-button>
            </div>
          </div>
        </div>
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

.quota {
  font-size: 11px;
  font-weight: 600;
  color: #16a34a;
}

.muted {
  font-size: 11px;
  color: rgba(31, 42, 68, 0.5);
}

.search-actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
}

.search-actions :deep(.van-button--primary) {
  background: linear-gradient(90deg, #2563eb, #3b82f6);
  border-color: transparent;
}

.search-actions :deep(.van-button--primary .van-loading__spinner) {
  color: #fff;
}

.search-actions :deep(.van-button--primary.van-button--loading) {
  background: linear-gradient(90deg, #1d4ed8, #2563eb);
}

.result-list {
  display: grid;
  gap: 10px;
}

.result-item {
  display: grid;
  grid-template-columns: 86px 1fr;
  gap: 12px;
  padding: 10px;
  background: #f8faff;
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.12);
}

.result-img {
  border-radius: 10px;
  overflow: hidden;
}

.result-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.result-score {
  font-size: 12px;
  font-weight: 700;
  color: #1f2a44;
}

.result-name {
  font-size: 11px;
  color: rgba(31, 42, 68, 0.6);
  word-break: break-all;
}

.empty {
  font-size: 12px;
  color: rgba(31, 42, 68, 0.5);
  text-align: center;
  padding: 14px 0;
}
</style>
