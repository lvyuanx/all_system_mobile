<script setup>
defineOptions({ name: 'ClientList' })

import { computed, onActivated, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getClientList } from '@/api/client'
import { formatMoney } from '@/utils/orderConstants'
import { useUserStore } from '@/stores/user'
import { useClientSearchStore } from '@/stores/clientSearch'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const searchStore = useClientSearchStore()

const permCodes = computed(() =>
  (userStore.permPacks || []).map((p) => p.pack_code || p.packCode).filter(Boolean),
)
const canViewAmount = computed(
  () => userStore.userInfo?.is_superuser || permCodes.value.includes('FINANCE_MANAGE'),
)

const search = ref('')
const companyName = ref('')
const list = ref([])
const loading = ref(false)
const requesting = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)
const PAGE_SIZE = 12

const showEmpty = computed(() => !loading.value && !list.value.length)

const resetList = () => {
  list.value = []
  page.value = 1
  finished.value = false
}

const buildFilter = () => {
  const filter = {}
  const keyword = search.value.trim()
  if (keyword) filter.search = keyword
  if (companyName.value) filter.company_name = companyName.value
  return filter
}

const loadMore = async (options = {}) => {
  const { silent = false } = options
  if (finished.value || requesting.value) {
    if (!silent) loading.value = false
    return
  }
  requesting.value = true
  if (!silent) loading.value = true
  try {
    const res = await getClientList(
      {
        page: page.value,
        page_size: PAGE_SIZE,
        filter: buildFilter(),
      },
      { loading: false },
    )
    const data = res?.data || {}
    const items = data.items || []
    const total = data.total_count !== undefined && data.total_count !== null ? Number(data.total_count) : null
    if (page.value === 1) list.value = []
    list.value.push(...items)
    if (total !== null) {
      finished.value = list.value.length >= (Number.isNaN(total) ? 0 : total)
    } else {
      finished.value = items.length < PAGE_SIZE
    }
    if (!finished.value) page.value += 1
  } catch {
    // 错误由拦截器处理
  } finally {
    requesting.value = false
    if (!silent) loading.value = false
  }
}

const onRefresh = async () => {
  resetList()
  await loadMore({ silent: true })
  refreshing.value = false
}

const onNavBack = () => {
  router.back()
}

const goSearch = () => {
  router.push({ path: '/home/client/search', query: search.value ? { keyword: search.value } : {} })
}

const goDetail = (client) => {
  router.push({
    path: '/home/client/detail',
    query: { client_id: client.client_id, name: client.client_name || '客户详情' },
  })
}

onMounted(() => {
  if (route.query.company_name) {
    companyName.value = String(route.query.company_name)
  }
  loadMore()
})

onActivated(() => {
  const pending = searchStore.takePendingKeyword()
  if (pending !== null) {
    search.value = pending
    companyName.value = ''
    resetList()
    loadMore()
  } else if (route.query.company_name && String(route.query.company_name) !== companyName.value) {
    companyName.value = String(route.query.company_name)
    search.value = ''
    resetList()
    loadMore()
  }
})
</script>

<template>
  <div class="page">
    <div class="search-wrap">
      <div class="search-bar" @click="goSearch">
        <button class="back-btn" @click.stop="onNavBack">
          <van-icon name="arrow-left" size="18" />
        </button>
        <div class="search-input-fake">
          <van-icon name="search" size="16" class="search-icon" />
          <span :class="search || companyName ? 'search-text' : 'search-placeholder'">
            {{ search || companyName || '搜索客户姓名 / 电话 / 公司' }}
          </span>
        </div>
      </div>
    </div>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadMore"
        class="list"
      >
        <div
          v-for="client in list"
          :key="client.client_id"
          class="client-card"
          @click="goDetail(client)"
        >
          <div class="card-top">
            <div class="avatar-wrap">
              <img
                v-if="client.company_logo"
                :src="client.company_logo"
                class="client-logo"
                alt=""
              />
              <div v-else class="client-avatar">{{ (client.client_name || '客').slice(0, 1) }}</div>
            </div>
            <div class="client-info">
              <div class="client-name">
                <span class="text-ellipsis">{{ client.client_name || '-' }}</span>
                <span v-if="client.client_sex_str" class="sex-tag">{{ client.client_sex_str }}</span>
              </div>
              <div class="client-company text-ellipsis">{{ client.company_name || '—' }}</div>
            </div>
            <div class="amount-wrap" v-if="canViewAmount">
              <div class="amount">￥{{ formatMoney(client.total_amount) }}</div>
              <div class="amount-sub">欠款 ￥{{ formatMoney(client.total_arrears) }}</div>
            </div>
          </div>

          <div class="card-main">
            <div class="meta-row">
              <van-icon name="phone-o" size="12" />
              <span>{{ client.client_phone || '-' }}</span>
            </div>
            <div class="meta-row">
              <van-icon name="location-o" size="12" />
              <span class="text-ellipsis">{{ client.full_address || '-' }}</span>
            </div>
          </div>

          <div class="card-footer">
            <div class="tag-list">
              <span v-for="name in client.site_names || []" :key="name" class="site-tag">{{ name }}</span>
            </div>
            <div class="order-stats">
              <span>订单 {{ client.total_order_count || 0 }}</span>
              <span class="dot-sep">·</span>
              <span>未结 {{ client.unfinished_order_total || 0 }}</span>
            </div>
          </div>
        </div>

        <template v-if="showEmpty" #finished>
          <div class="empty-wrap">
            <van-empty description="暂无客户" />
          </div>
        </template>
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<style scoped>
.page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: #f2f3f7;
}

:deep(.van-pull-refresh) {
  flex: 1;
}

:deep(.van-pull-refresh__track),
:deep(.van-list) {
  min-height: 100%;
}

.search-wrap {
  position: sticky;
  top: 0;
  z-index: 12;
  background: var(--color-background);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 10px;
  padding-top: calc(10px + env(safe-area-inset-top));
  background: var(--color-background);
}

.back-btn {
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #1f2937;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.search-input-fake {
  flex: 1;
  min-width: 0;
  height: 34px;
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid #eceff3;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px 0 10px;
  cursor: pointer;
}

.search-icon {
  color: #9ca3af;
  font-size: 14px;
  flex-shrink: 0;
}

.search-placeholder {
  font-size: 13px;
  color: #9ca3af;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-text {
  font-size: 13px;
  color: #374151;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list {
  padding: 8px 12px 20px;
}

.empty-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.client-card {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #eef0f4;
  cursor: pointer;
  transition: transform 0.15s ease;
  overflow: hidden;
}

.client-card:active {
  transform: scale(0.985);
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f3f4f6;
}

.avatar-wrap {
  flex-shrink: 0;
}

.client-logo {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  object-fit: contain;
  border: 1px solid #eef0f4;
  background: #f9fafb;
}

.client-avatar {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2563eb, #60a5fa);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.client-info {
  flex: 1;
  min-width: 0;
}

.client-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 700;
  color: #111827;
}

.client-company {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.sex-tag {
  font-size: 11px;
  color: #2563eb;
  background: #eff6ff;
  padding: 2px 6px;
  border-radius: 999px;
  flex-shrink: 0;
}

.amount-wrap {
  text-align: right;
  flex-shrink: 0;
}

.amount {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
}

.amount-sub {
  font-size: 11px;
  color: #dc2626;
  margin-top: 2px;
}

.card-main {
  display: grid;
  gap: 6px;
  padding: 10px 0;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
}

.tag-list {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.site-tag {
  font-size: 11px;
  color: #0f172a;
  background: #f1f5f9;
  border-radius: 999px;
  padding: 2px 8px;
}

.order-stats {
  font-size: 12px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.dot-sep {
  color: #cbd5e1;
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
