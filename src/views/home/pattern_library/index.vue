<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showImagePreview } from 'vant'
import { getPatternList } from '@/api/pattern'

const router = useRouter()

const activeTab = ref('active')
const search = ref('')

// 列表状态
const list = ref([])
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const LIMIT = 20

const resetList = () => {
  list.value = []
  page.value = 1
  finished.value = false
}

const loadMore = async () => {
  if (loading.value || finished.value) return
  loading.value = true
  try {
    const res = await getPatternList({
      page: page.value,
      page_size: LIMIT,
      filter: JSON.stringify({
        is_active: activeTab.value === 'active',
        search: search.value || undefined,
      }),
    }, { loading: false })

    const items = res?.data?.items || []
    const totalCount = res?.data?.total_count || 0
    list.value.push(...items)
    page.value += 1
    if (list.value.length >= totalCount) finished.value = true
  } finally {
    loading.value = false
  }
}

// tab 或 搜索变化时重置
watch(activeTab, () => {
  resetList()
  loadMore()
})

const onSearch = () => {
  resetList()
  loadMore()
}

const onClear = () => {
  search.value = ''
  resetList()
  loadMore()
}

// 下架功能已移至详情页
const onPreviewImage = (url, e) => {
  e.stopPropagation()
  if (url) showImagePreview([url])
}

// 初始加载
loadMore()
</script>

<template>
  <div class="page">

    <!-- 顶部搜索区 -->
    <div class="search-wrap">
      <div class="search-inner">
        <van-icon name="search" class="search-icon" />
        <input
          v-model="search"
          class="search-input"
          placeholder="搜索版号 / 备注"
          @keyup.enter="onSearch"
        />
        <button v-if="search" class="clear-btn" @click="onClear">
          <van-icon name="cross" size="14" />
        </button>
        <button class="search-btn" @click="onSearch">搜索</button>
      </div>
    </div>

    <!-- Tabs -->
    <van-tabs v-model:active="activeTab" sticky offset-top="60px" class="tabs">
      <van-tab title="已上架" name="active" />
      <van-tab title="已下架" name="inactive" />
    </van-tabs>

    <!-- 列表 -->
    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="loadMore"
      class="list"
    >
      <div
        v-for="item in list"
        :key="item.pattern_code"
        class="pattern-card"
        @click="router.push({ path: '/home/pattern-library/detail', query: { code: item.pattern_code, pattern_id: item.pattern_id } })"
      >
        <van-image
          :src="item.main_image"
          width="72"
          height="72"
          fit="cover"
          class="thumb"
          @click.stop="onPreviewImage(item.main_image, $event)"
        />
        <div class="card-body">
          <span class="code">{{ item.pattern_code }}</span>
          <span class="memo">{{ item.pattern_memo || '暂无备注' }}</span>
        </div>
        <van-icon name="arrow" class="arrow-icon" />
      </div>

      <template v-if="!loading && list.length === 0" #finished>
        <van-empty description="暂无数据" />
      </template>
    </van-list>

  </div>
</template>

<style scoped>
.page {
  min-height: 100%;
  background: #f2f3f7;
}

/* ── 搜索栏 ── */
.search-wrap {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 10px 16px 8px;
  background: #f2f3f7;
}

.search-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  background: #fff;
  border-radius: 20px;
  padding: 0 6px 0 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
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
  font-size: 14px;
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
  font-size: 13px;
  font-weight: 600;
  padding: 0 14px;
  height: 30px;
  border-radius: 15px;
  cursor: pointer;
  flex-shrink: 0;
  letter-spacing: 0.5px;
}

/* ── Tabs ── */
.tabs {
  position: sticky;
  top: 60px;
  z-index: 9;
  background: #f2f3f7;
}

.tabs :deep(.van-tabs__wrap) {
  background: #f2f3f7;
}

/* ── 列表 ── */
.list {
  padding: 10px 12px 24px;
}

.pattern-card {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  padding: 12px 14px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: opacity 0.15s;
}

.pattern-card:active {
  opacity: 0.75;
}

.thumb {
  flex-shrink: 0;
  border-radius: 10px;
  overflow: hidden;
  background: #f5f5f5;
}

.thumb :deep(img) {
  border-radius: 10px;
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.code {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.memo {
  font-size: 12px;
  color: #aaa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arrow-icon {
  color: #ddd;
  flex-shrink: 0;
}
</style>
