<script setup>
defineOptions({ name: 'OrderPatternSelect' })

import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getPatternList } from '@/api/pattern'
import { goBackWithTransition } from '@/utils/navigationTransition'
import { useOrderCreateStore } from '@/stores/orderCreate'

const route = useRoute()
const router = useRouter()
const orderCreateStore = useOrderCreateStore()

const pageRef = ref(null)
const search = ref('')
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const list = ref([])
const PAGE_SIZE = 15

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
  orderCreateStore.applyPatternToItem(targetIndex, item)
  router.back()
}

const onClickLeft = () => {
  goBackWithTransition(router, '/home/order/create')
}

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    resetList()
    loadMore()
  }, 250)
})

onMounted(() => {
  orderCreateStore.initializeDraft()
  loadMore()
})

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
})
</script>

<template>
  <div ref="pageRef" class="page">
    <div class="page-topbar">
      <div class="topbar-inner">
        <button class="back-btn" @click="onClickLeft">
          <van-icon name="arrow-left" size="18" />
        </button>
        <div class="topbar-title">选择款号</div>
        <div class="topbar-spacer"></div>
      </div>
    </div>

    <div class="content">
      <div class="search-card">
        <van-icon name="search" class="search-icon" />
        <input v-model="search" class="search-input" placeholder="搜索款号、备注或关键词" />
      </div>

      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadMore"
      >
        <div v-for="item in list" :key="item.pattern_id" class="pattern-card" @click="selectPattern(item)">
          <van-image
            :src="item.main_image"
            width="68"
            height="68"
            fit="cover"
            class="thumb"
          />
          <div class="card-body">
            <div class="code-row">
              <div class="code">{{ item.pattern_code || '-' }}</div>
              <div class="select-tag">回填</div>
            </div>
            <div class="memo">{{ item.pattern_memo || '暂无备注，可在创建页继续补充订单项说明。' }}</div>
          </div>
        </div>

        <div v-if="!loading && list.length === 0" class="empty">
          <van-empty description="暂无款号" />
        </div>
      </van-list>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  overflow-y: auto;
  background: #f4f6fb;
}

.page-topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  padding-top: env(safe-area-inset-top);
  background: #f4f6fb;
}

.topbar-inner {
  height: 46px;
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  padding: 0 8px 0 4px;
}

.back-btn {
  border: 0;
  background: transparent;
  color: #1f2a44;
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.topbar-title {
  font-size: 17px;
  font-weight: 700;
  color: #1f2a44;
  text-align: center;
}

.content {
  padding: 10px 12px 12px;
}

.search-card {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border-radius: 16px;
  padding: 12px 14px;
  box-shadow: 0 8px 20px rgba(31, 42, 68, 0.08);
  margin-bottom: 12px;
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
  font-size: 14px;
  color: #1f2a44;
}

.pattern-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  margin-bottom: 10px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(31, 42, 68, 0.08);
}

.thumb {
  border-radius: 12px;
  overflow: hidden;
  background: #f3f4f6;
  flex-shrink: 0;
}

.card-body {
  flex: 1;
  min-width: 0;
}

.code-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.code {
  font-size: 15px;
  font-weight: 700;
  color: #1f2a44;
  line-height: 1.4;
  word-break: break-all;
}

.select-tag {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(124, 58, 237, 0.1);
  color: #7c3aed;
  font-size: 11px;
  font-weight: 700;
}

.memo {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: #475569;
  word-break: break-all;
}

.empty {
  margin-top: 48px;
}
</style>
