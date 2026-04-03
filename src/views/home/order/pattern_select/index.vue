<script setup>
defineOptions({ name: 'OrderPatternSelect' })
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getPatternList } from '@/api/pattern'

const route = useRoute()
const router = useRouter()

const DRAFT_KEY = 'order_create_draft'
const search = ref('')
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const PAGE_SIZE = 15
const list = ref([])

let searchTimer = null

const resetList = () => {
  page.value = 1
  finished.value = false
  list.value = []
}

const buildFilter = () => {
  const filter = {}
  const keyword = search.value.trim()
  if (keyword) filter.search = keyword
  return filter
}

const loadMore = async () => {
  if (loading.value || finished.value) return
  loading.value = true
  try {
    const res = await getPatternList(
      {
        page: page.value,
        page_size: PAGE_SIZE,
        filter: JSON.stringify(buildFilter()),
      },
      { loading: false },
    )
    const data = res?.data || {}
    const items = data.items || []
    const total = Number(data.total_count || 0)
    list.value.push(...items)
    if (list.value.length >= total || items.length < PAGE_SIZE) {
      finished.value = true
    } else {
      page.value += 1
    }
  } catch {
    showToast('加载款号失败')
  } finally {
    loading.value = false
  }
}

const selectPattern = (item) => {
  const idxRaw = route.query.index
  const idx = Number(idxRaw)
  const targetIndex = Number.isNaN(idx) ? 0 : Math.max(0, idx)
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    const draft = raw ? JSON.parse(raw) : {}
    const items = Array.isArray(draft.items) ? draft.items : []
    if (!items[targetIndex]) {
      items[targetIndex] = {
        pattern_code: '',
        color: '',
        count: 1,
        unit_price: '',
        discount_price: '0',
        total_unit: '',
        memo: '',
      }
    }
    items[targetIndex] = {
      ...items[targetIndex],
      pattern_code: item.pattern_code || '',
    }
    draft.items = items
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {}
  router.back()
}

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    resetList()
    loadMore()
  }, 250)
})

onMounted(loadMore)

onBeforeUnmount(() => {
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
})
</script>

<template>
  <div class="page">
    <div class="header">
      <div class="title">选择款号</div>
      <div class="subtitle">选择版号快速填充订单项</div>
    </div>

    <div class="search-wrap">
      <div class="search-inner">
        <van-icon name="search" class="search-icon" />
        <input v-model="search" class="search-input" placeholder="搜索款号 / 备注" />
      </div>
    </div>

    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="loadMore"
      class="list"
    >
      <div v-for="item in list" :key="item.pattern_id" class="pattern-card" @click="selectPattern(item)">
        <van-image
          :src="item.main_image"
          width="64"
          height="64"
          fit="cover"
          class="thumb"
        />
        <div class="card-body">
          <div class="code">{{ item.pattern_code }}</div>
          <div class="memo">{{ item.pattern_memo || '暂无备注' }}</div>
        </div>
        <van-icon name="arrow" class="arrow-icon" />
      </div>

      <div v-if="!loading && list.length === 0" class="empty">
        <van-empty description="暂无款号" />
      </div>
    </van-list>
  </div>
</template>

<style scoped>
.page {
  min-height: 100%;
  background: #f4f6fb;
  padding-bottom: 20px;
}

.header {
  padding: 20px 16px 12px;
  background: linear-gradient(135deg, #f8fbff 0%, #eef5ff 100%);
  border-radius: 0 0 22px 22px;
  box-shadow: 0 8px 20px rgba(31, 42, 68, 0.08);
}

.title {
  font-size: 18px;
  font-weight: 800;
  color: #1f2a44;
}

.subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(31, 42, 68, 0.55);
}

.search-wrap {
  padding: 10px 16px 4px;
}

.search-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  background: #fff;
  border-radius: 20px;
  padding: 0 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.search-icon {
  color: #94a3b8;
  font-size: 16px;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: #1f2a44;
}

.list {
  padding: 8px 16px 24px;
}

.pattern-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 10px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(31, 42, 68, 0.08);
  cursor: pointer;
}

.pattern-card:active {
  opacity: 0.85;
}

.thumb {
  border-radius: 10px;
  overflow: hidden;
  background: #f3f4f6;
}

.card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.code {
  font-size: 14px;
  font-weight: 700;
  color: #1f2a44;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.memo {
  font-size: 12px;
  color: rgba(31, 42, 68, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arrow-icon {
  color: #cbd5f5;
}

.empty {
  margin-top: 40px;
}
</style>
