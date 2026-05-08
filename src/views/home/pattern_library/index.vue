<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showImagePreview } from 'vant'
import { getPatternList } from '@/api/pattern'
import AppSearchNavBar from '@/components/AppSearchNavBar.vue'
import { goBackWithTransition } from '@/utils/navigationTransition'

const router = useRouter()

const activeTab = ref('active')
const search = ref('')
const showFilterPanel = ref(false)

// 列表状态
const list = ref([])
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const LIMIT = 20

const currentTabLabel = computed(() => (activeTab.value === 'active' ? '已上架' : '已下架'))
const emptyDescription = computed(() =>
  search.value.trim()
    ? `没有找到和“${search.value.trim()}”相关的版式`
    : `${currentTabLabel.value}版式为空`,
)

const onClickLeft = () => {
  goBackWithTransition(router, '/home')
}

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

const applyStatusFilter = (status) => {
  if (activeTab.value === status) {
    showFilterPanel.value = false
    return
  }
  activeTab.value = status
  showFilterPanel.value = false
}

const goDetail = (item) => {
  router.push({
    path: '/home/pattern-library/detail',
    query: { code: item.pattern_code, pattern_id: item.pattern_id },
  })
}

const onPreviewImage = (url, e) => {
  e.stopPropagation()
  if (url) showImagePreview([url])
}

// 初始加载
loadMore()
</script>

<template>
  <div class="page">
    <div class="search-wrap">
      <AppSearchNavBar
        v-model="search"
        placeholder="搜索版号 / 备注"
        :show-back="true"
        :readonly="false"
        @click-left="onClickLeft"
        @clear="onClear"
        @search="onSearch"
      >
        <template #right>
          <button type="button" class="nav-action" @click="showFilterPanel = true">
            <van-icon name="filter-o" size="16" />
            <span>筛选</span>
          </button>
        </template>
      </AppSearchNavBar>

      <div class="status-summary">
        <span class="summary-title">{{ currentTabLabel }}</span>
        <span class="summary-count">{{ list.length }} 项</span>
      </div>
    </div>

    <van-popup
      v-model:show="showFilterPanel"
      position="top"
      round
      class="filter-popup"
    >
      <div class="filter-section">
        <div class="filter-title">按状态筛选</div>
        <div class="chip-grid">
          <button
            type="button"
            class="filter-chip-btn"
            :class="{ active: activeTab === 'active' }"
            @click="applyStatusFilter('active')"
          >
            已上架
          </button>
          <button
            type="button"
            class="filter-chip-btn"
            :class="{ active: activeTab === 'inactive' }"
            @click="applyStatusFilter('inactive')"
          >
            已下架
          </button>
        </div>
      </div>
    </van-popup>

    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="loadMore"
      class="list"
    >
      <article
        v-for="item in list"
        :key="item.pattern_code"
        class="pattern-card"
        @click="goDetail(item)"
      >
        <div class="card-top">
          <div class="code-line">
            <span class="code text-ellipsis">{{ item.pattern_code || '-' }}</span>
            <van-icon name="arrow" size="11" class="code-arrow" />
          </div>
          <span class="top-status" :class="activeTab === 'active' ? 'status-active' : 'status-inactive'">
            {{ currentTabLabel }}
          </span>
        </div>

        <div class="card-main">
          <div class="thumb-wrap" @click.stop="onPreviewImage(item.main_image, $event)">
            <van-image
              :src="item.main_image"
              width="72"
              height="72"
              fit="cover"
              class="thumb"
            />
          </div>
          <div class="meta-wrap">
            <div class="memo-block">
              {{ item.pattern_memo || '暂无备注，进入详情后可补充版式说明。' }}
            </div>
            <div class="meta-foot">
              <span class="meta-label">版式编号</span>
            </div>
          </div>
        </div>
      </article>

      <template v-if="!loading && list.length === 0" #finished>
        <div class="empty-wrap">
          <van-empty :description="emptyDescription" />
        </div>
      </template>
    </van-list>
  </div>
</template>

<style scoped>
.page {
  position: relative;
  min-height: 100%;
  background: var(--color-background);
  padding: 0 14px 24px;
}

.search-wrap {
  position: sticky;
  top: 0;
  z-index: 12;
  background: var(--color-background);
}

.search-wrap :deep(.app-search-nav) {
  background: var(--color-background);
}

.search-wrap :deep(.left-btn) {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: transparent;
  color: #1f2937;
}

.search-wrap :deep(.search-box) {
  height: 34px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid #eceff3;
  box-shadow: none;
}

.search-wrap :deep(.search-input) {
  font-size: 13px;
}

.status-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 10px 2px 0;
  padding: 0 2px 2px;
}

.summary-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.summary-count {
  font-size: 12px;
  color: #9ca3af;
}

.nav-action {
  border: none;
  background: transparent;
  color: #475569;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  font-size: 10px;
  padding: 0;
  min-width: 32px;
  height: 34px;
  cursor: pointer;
}

.filter-popup {
  background: var(--color-background);
  padding: 10px 12px 14px;
}

.filter-section {
  margin-bottom: 2px;
}

.filter-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 10px;
}

.chip-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.filter-chip-btn {
  border: 0;
  background: #ffffff;
  color: #374151;
  height: 36px;
  border-radius: 18px;
  font-size: 13px;
  font-weight: 600;
}

.filter-chip-btn.active {
  background: color-mix(in srgb, var(--color-primary) 16%, #ffffff);
  color: var(--color-primary);
}

.list {
  padding-top: 8px;
}

.pattern-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
  padding: 12px 12px 10px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #eef0f4;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.pattern-card:active {
  transform: scale(0.985);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.code-line {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
}

.code {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.code-arrow {
  color: #c4c9d4;
  flex-shrink: 0;
}

.top-status {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid currentColor;
}

.top-status.status-active {
  color: #2563eb;
  background: #eff6ff;
  border-color: #bfdbfe;
}

.top-status.status-inactive {
  color: #9ca3af;
  background: #f9fafb;
  border-color: #e5e7eb;
}

.card-main {
  display: flex;
  gap: 10px;
  align-items: center;
  gap: 10px;
}

.thumb-wrap {
  flex-shrink: 0;
}

.thumb {
  border-radius: 8px;
  overflow: hidden;
  background: #f3f4f6;
}

.thumb :deep(img) {
  border-radius: 8px;
}

.meta-wrap {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.memo-block {
  font-size: 12px;
  line-height: 1.6;
  color: #6b7280;
}

.meta-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
}

.meta-label {
  font-size: 11px;
  color: #9ca3af;
}

.empty-wrap {
  padding: 32px 0 16px;
}

@media (max-width: 360px) {
  .page {
    padding-left: 12px;
    padding-right: 12px;
  }

  .pattern-card {
    padding: 10px;
  }

  .thumb {
    width: 78px !important;
    height: 78px !important;
  }
}
</style>
