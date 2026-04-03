<script setup>
defineOptions({ name: 'OrderPartnerSelect' })
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getClientAddressList, getSiteAddressList } from '@/api/order'

const route = useRoute()
const router = useRouter()

const DRAFT_KEY = 'order_create_draft'
const type = computed(() => (route.query.type === 'shipping' ? 'shipping' : 'receiver'))
const siteId = computed(() => {
  const raw = route.query.site_id
  if (raw === undefined || raw === null || raw === '') return null
  const num = Number(raw)
  return Number.isNaN(num) ? null : num
})

const search = ref('')
let searchTimer = null
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const PAGE_SIZE = 15
const items = ref([])

const titleText = computed(() => (type.value === 'shipping' ? '选择发货方' : '选择收货方'))

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
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    const draft = raw ? JSON.parse(raw) : {}
    if (type.value === 'receiver') {
      draft.receiver_name = item.receiver_name || ''
      draft.receiver_company = item.receiver_company || ''
      draft.receiver_phone = item.receiver_phone || ''
      draft.receiver_address = item.receiver_address || ''
    } else {
      draft.shipping_party = item.shipping_party || ''
      draft.shipping_party_company = item.shipping_party_company || ''
      draft.shipping_party_phone = item.shipping_party_phone || ''
      draft.shipping_party_address = item.shipping_party_address || ''
    }
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {}
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
  loadMore()
})

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
      <div class="title">{{ titleText }}</div>
      <div class="subtitle">选择历史信息快速填充</div>
    </div>

    <div class="search-wrap">
      <div class="search-inner">
        <van-icon name="search" class="search-icon" />
        <input
          v-model="search"
          class="search-input"
          placeholder="搜索名称或公司"
        />
      </div>
    </div>

    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="loadMore"
      class="list"
    >
      <div
        v-for="(item, idx) in items"
        :key="idx"
        class="option-card"
        @click="selectItem(item)"
      >
        <template v-if="type === 'shipping'">
          <div class="option-name">{{ item.shipping_party || '-' }}</div>
          <div class="option-company">{{ item.shipping_party_company || '-' }}</div>
          <div class="option-meta">{{ item.shipping_party_phone || '-' }}</div>
          <div class="option-meta">{{ item.shipping_party_address || '-' }}</div>
        </template>
        <template v-else>
          <div class="option-name">{{ item.receiver_name || '-' }}</div>
          <div class="option-company">{{ item.receiver_company || '-' }}</div>
          <div class="option-meta">{{ item.receiver_phone || '-' }}</div>
          <div class="option-meta">{{ item.receiver_address || '-' }}</div>
        </template>
      </div>

      <div v-if="!loading && items.length === 0" class="empty">
        <van-empty description="暂无可选项" />
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

.option-card {
  background: #fff;
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 10px;
  box-shadow: 0 4px 16px rgba(31, 42, 68, 0.08);
  cursor: pointer;
  display: grid;
  gap: 6px;
}

.option-card:active {
  opacity: 0.85;
}

.option-name {
  font-size: 14px;
  font-weight: 700;
  color: #1f2a44;
}

.option-company {
  font-size: 12px;
  color: rgba(31, 42, 68, 0.6);
}

.empty {
  margin-top: 40px;
}
</style>
