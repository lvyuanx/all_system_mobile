<script setup>
defineOptions({ name: 'OrderSearch' })

import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrderSearchStore } from '@/stores/orderSearch'
import AppSearchNavBar from '@/components/AppSearchNavBar.vue'

const router = useRouter()
const route = useRoute()
const searchStore = useOrderSearchStore()

const keyword = ref(String(route.query.keyword || ''))
const histories = computed(() => searchStore.recentKeywords)

const submitSearch = () => {
  const value = keyword.value.trim()
  if (value) {
    searchStore.addKeyword(value)
  }
  searchStore.setPendingKeyword(value)

  const hasBack = Boolean(window.history.state?.back)
  if (hasBack) {
    router.back()
    return
  }

  router.replace({
    path: '/home/order',
    query: value ? { keyword: value } : {},
  })
}

const pickHistory = (item) => {
  keyword.value = item
  submitSearch()
}

const clearHistory = () => {
  searchStore.clearAll()
}
</script>

<template>
  <div class="page">
    <AppSearchNavBar
      v-model="keyword"
      placeholder="搜索我的订单"
      :show-back="false"
      @search="submitSearch"
    >
      <template #right>
        <button type="button" class="search-btn" @click="submitSearch">搜索</button>
      </template>
    </AppSearchNavBar>

    <div class="content">
      <div class="history-header">
        <span>最近搜索</span>
        <button
          v-if="histories.length"
          type="button"
          class="clear-all"
          @click="clearHistory"
        >
          清空
        </button>
      </div>

      <div v-if="histories.length" class="history-list">
        <button
          v-for="item in histories"
          :key="item"
          type="button"
          class="history-item"
          @click="pickHistory(item)"
        >
          {{ item }}
        </button>
      </div>
      <div v-else class="empty">暂无搜索记录</div>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100%;
  background: #f2f3f7;
}

.content {
  padding: 12px;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  color: #374151;
}

.clear-all {
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font-size: 13px;
}

.history-list {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-item {
  border: 0;
  background: #ffffff;
  color: #374151;
  padding: 8px 12px;
  border-radius: 16px;
  font-size: 13px;
}

.empty {
  margin-top: 12px;
  color: #9ca3af;
  font-size: 13px;
}

.search-btn {
  border: 0;
  background: var(--color-primary);
  color: #fff;
  border-radius: 14px;
  height: 28px;
  padding: 0 12px;
  font-size: 12px;
}
</style>
