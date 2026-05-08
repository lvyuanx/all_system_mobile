<script setup>
defineOptions({ name: 'OrderPartnerSelect' })

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getClientAddressList, getSiteAddressList } from '@/api/order'
import { useOrderCreateStore } from '@/stores/orderCreate'

const route = useRoute()
const router = useRouter()
const orderCreateStore = useOrderCreateStore()

const type = computed(() => (route.query.type === 'shipping' ? 'shipping' : 'receiver'))
const siteId = computed(() => {
  const raw = route.query.site_id
  if (raw === undefined || raw === null || raw === '') return null
  const num = Number(raw)
  return Number.isNaN(num) ? null : num
})
const pageTitle = computed(() => (type.value === 'shipping' ? '选择发货方' : '选择收货方'))

const pageRef = ref(null)
const search = ref('')
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const items = ref([])
const PAGE_SIZE = 15

let searchTimer = null

const resetList = () => {
  page.value = 1
  finished.value = false
  items.value = []
}

const buildFilter = () => {
  const filter = {}
  const keyword = search.value.trim()
  if (keyword) filter.search = keyword
  if (siteId.value) filter.site_id = siteId.value
  return filter
}

const loadMore = async () => {
  if (loading.value || finished.value) return
  loading.value = true
  try {
    const payload = {
      page: page.value,
      page_size: PAGE_SIZE,
      filter: buildFilter(),
    }
    const res =
      type.value === 'shipping'
        ? await getSiteAddressList(payload, { loading: false })
        : await getClientAddressList(payload, { loading: false })
    const data = res?.data || {}
    const list = data.items || []
    const total = Number(data.total_count || 0)
    items.value.push(...list)
    if (items.value.length >= total || list.length < PAGE_SIZE) {
      finished.value = true
    } else {
      page.value += 1
    }
  } catch {
    showToast('加载数据失败')
  } finally {
    loading.value = false
  }
}

const selectItem = (item) => {
  if (type.value === 'shipping') {
    orderCreateStore.updateShippingParty({
      shipping_party: item.shipping_party || '',
      shipping_party_company: item.shipping_party_company || '',
      shipping_party_phone: item.shipping_party_phone || '',
      shipping_party_address: item.shipping_party_address || '',
    })
  } else {
    orderCreateStore.updateReceiver({
      receiver_name: item.receiver_name || '',
      receiver_company: item.receiver_company || '',
      receiver_phone: item.receiver_phone || '',
      receiver_address: item.receiver_address || '',
    })
  }
  router.back()
}

const onClickLeft = () => {
  router.back()
}

watch([type, siteId], () => {
  resetList()
  loadMore()
})

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
        <div class="topbar-title">{{ pageTitle }}</div>
        <div class="topbar-spacer"></div>
      </div>
    </div>

    <div class="content">
      <div class="search-card">
        <van-icon name="search" class="search-icon" />
        <input
          v-model="search"
          class="search-input"
          placeholder="搜索名称、公司、电话或地址"
        />
      </div>

      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadMore"
      >
        <div
          v-for="(item, idx) in items"
          :key="idx"
          class="option-card"
          @click="selectItem(item)"
        >
          <div class="option-top">
            <div class="option-name">
              {{ type === 'shipping' ? (item.shipping_party || '-') : (item.receiver_name || '-') }}
            </div>
            <div class="option-badge">{{ type === 'shipping' ? '发货方' : '收货方' }}</div>
          </div>
          <div class="option-company">
            {{ type === 'shipping' ? (item.shipping_party_company || '暂无公司') : (item.receiver_company || '暂无公司') }}
          </div>
          <div class="option-meta">
            <van-icon name="phone-o" class="meta-icon" />
            <span>{{ type === 'shipping' ? (item.shipping_party_phone || '-') : (item.receiver_phone || '-') }}</span>
          </div>
          <div class="option-meta option-meta--address">
            <van-icon name="location-o" class="meta-icon" />
            <span>{{ type === 'shipping' ? (item.shipping_party_address || '-') : (item.receiver_address || '-') }}</span>
          </div>
        </div>

        <div v-if="!loading && items.length === 0" class="empty">
          <van-empty description="暂无可选地址" />
        </div>
      </van-list>
    </div>
  </div>
</template>

<style scoped>
.page {
  --c-text: #1f2a44;
  --c-sub: #475569;
  --c-muted: #94a3b8;
  --c-border: #e5e7eb;
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
  color: var(--c-text);
}

.option-card {
  background: #fff;
  border-radius: 16px;
  padding: 14px 16px;
  margin-bottom: 10px;
  box-shadow: 0 8px 20px rgba(31, 42, 68, 0.08);
}

.option-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.option-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--c-text);
}

.option-badge {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.1);
  color: #0f766e;
  font-size: 11px;
  font-weight: 700;
}

.option-company {
  margin-top: 8px;
  font-size: 13px;
  color: var(--c-sub);
}

.option-meta {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--c-sub);
}

.option-meta--address span {
  word-break: break-all;
}

.meta-icon {
  color: var(--c-muted);
  flex-shrink: 0;
  margin-top: 1px;
}

.empty {
  margin-top: 48px;
}
</style>
