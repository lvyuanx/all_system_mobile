<script setup>
defineOptions({ name: 'StaffList' })

import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import AppSearchNavBar from '@/components/AppSearchNavBar.vue'
import { goBackWithTransition } from '@/utils/navigationTransition'
import {
  activateStaff,
  deactivateStaff,
  getStaffGroupOptions,
  getStaffList,
} from '@/api/staff'

const router = useRouter()
const route = useRoute()

const search = ref('')
const statusTab = ref('all')
const showFilterPanel = ref(false)
const selectedGroupId = ref(null)
const groupOptions = ref([])

const list = ref([])
const loading = ref(false)
const requesting = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const loadError = ref(false)
const page = ref(1)
const PAGE_SIZE = 12

const siteId = computed(() => {
  const raw = Number(route.query.site_id)
  return Number.isNaN(raw) || raw <= 0 ? null : raw
})

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '启用' },
  { key: 'inactive', label: '禁用' },
]

const selectedGroupName = computed(() => {
  if (!selectedGroupId.value) return '全部权限组'
  const found = groupOptions.value.find((item) => item.value === selectedGroupId.value)
  return found?.label || '全部权限组'
})

const showEmpty = computed(() => !loading.value && !loadError.value && list.value.length === 0)

const resetList = () => {
  list.value = []
  page.value = 1
  finished.value = false
  loadError.value = false
}

const buildFilter = () => {
  const filter = {}
  const keyword = search.value.trim()
  if (keyword) filter.search = keyword
  if (statusTab.value === 'active') filter.is_active = true
  if (statusTab.value === 'inactive') filter.is_active = false
  if (selectedGroupId.value) filter.group_id = selectedGroupId.value
  if (siteId.value) filter.site_id = siteId.value
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
    const res = await getStaffList(
      {
        page: page.value,
        page_size: PAGE_SIZE,
        filter: buildFilter(),
      },
      { loading: false },
    )

    const data = res?.data || {}
    const items = Array.isArray(data.items) ? data.items : []
    const hasTotal = data.total_count !== undefined && data.total_count !== null
    const total = hasTotal ? Number(data.total_count) : null

    if (page.value === 1) {
      list.value = []
      loadError.value = false
    }

    list.value.push(...items)

    if (hasTotal) {
      finished.value = list.value.length >= (Number.isNaN(total) ? 0 : total)
    } else {
      finished.value = items.length < PAGE_SIZE
    }

    if (!finished.value) page.value += 1
  } catch {
    if (page.value === 1 && list.value.length === 0) {
      loadError.value = true
    }
  } finally {
    requesting.value = false
    if (!silent) loading.value = false
  }
}

const fetchGroupOptions = async () => {
  try {
    const res = await getStaffGroupOptions({ loading: false })
    const options = Array.isArray(res?.data) ? res.data : []
    groupOptions.value = options.map((item) => ({
      value: Number(item.group_id),
      label: item.group_name || '-',
    }))
  } catch {
    groupOptions.value = []
  }
}

const onRefresh = async () => {
  refreshing.value = true
  resetList()
  try {
    await loadMore({ silent: true })
  } finally {
    refreshing.value = false
  }
}

const onSearch = () => {
  resetList()
  loadMore()
}

const onClear = () => {
  search.value = ''
  resetList()
  loadMore()
}

const onChangeStatus = (key) => {
  if (statusTab.value === key) return
  statusTab.value = key
  resetList()
  loadMore()
}

const clearFilter = () => {
  selectedGroupId.value = null
}

const applyFilter = () => {
  showFilterPanel.value = false
  resetList()
  loadMore()
}

const onNavBack = () => {
  goBackWithTransition(router, '/home')
}

const toGroupList = (groupNames) => {
  if (Array.isArray(groupNames)) return groupNames.filter(Boolean)
  if (typeof groupNames === 'string') {
    return groupNames
      .split(/[、,，]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

const goDetail = (staff) => {
  router.push({
    path: '/home/staff/detail',
    query: {
      user_id: staff.user_id,
      name: '员工详情',
    },
  })
}

const getStatusLabel = (active) => (active ? '启用' : '禁用')
const getStatusClass = (active) => (active ? 'status-active' : 'status-inactive')

const toggleStaffStatus = async (staff) => {
  const isActive = Boolean(staff.is_active)
  const actionText = isActive ? '禁用' : '启用'

  try {
    await showConfirmDialog({
      title: '提示',
      message: `确认${actionText}该员工账号？`,
    })
  } catch {
    return
  }

  try {
    const api = isActive ? deactivateStaff : activateStaff
    await api({ user_id: staff.user_id }, { loading: false })
    showToast(`${actionText}成功`)
    resetList()
    await loadMore({ silent: true })
  } catch {
    // 错误由拦截器处理
  }
}

onMounted(async () => {
  await fetchGroupOptions()
  loadMore()
})
</script>

<template>
  <div class="page">
    <div class="search-wrap">
      <AppSearchNavBar
        v-model="search"
        placeholder="搜索工号 / 姓名 / 手机号 / 用户名"
        :show-back="true"
        :readonly="false"
        @click-left="onNavBack"
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

      <div class="status-tabs">
        <button
          v-for="item in statusTabs"
          :key="item.key"
          type="button"
          class="status-tab-btn"
          :class="{ active: statusTab === item.key }"
          @click="onChangeStatus(item.key)"
        >
          {{ item.label }}
        </button>
      </div>
    </div>

    <van-popup
      v-model:show="showFilterPanel"
      position="top"
      round
      class="filter-popup"
    >
      <div class="filter-section">
        <div class="filter-title">按权限组筛选</div>
        <div class="chip-grid">
          <button
            type="button"
            class="filter-chip-btn"
            :class="{ active: selectedGroupId === null }"
            @click="selectedGroupId = null"
          >
            全部权限组
          </button>
          <button
            v-for="item in groupOptions"
            :key="item.value"
            type="button"
            class="filter-chip-btn"
            :class="{ active: selectedGroupId === item.value }"
            @click="selectedGroupId = item.value"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div class="filter-current">当前：{{ selectedGroupName }}</div>

      <div class="filter-actions">
        <button type="button" class="panel-btn panel-btn-ghost" @click="clearFilter">清空</button>
        <button type="button" class="panel-btn panel-btn-primary" @click="applyFilter">确定</button>
      </div>
    </van-popup>

    <van-pull-refresh v-model="refreshing" class="refresh-wrap" @refresh="onRefresh">
      <div v-if="loadError && !loading && list.length === 0" class="state-wrap">
        <van-empty image="error" description="员工列表加载失败，请稍后重试">
          <van-button round type="primary" class="retry-btn" @click="onSearch">重新加载</van-button>
        </van-empty>
      </div>

      <van-list
        v-else
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadMore"
        class="list"
      >
        <div
          v-for="staff in list"
          :key="staff.staff_id || staff.user_id"
          class="staff-card"
          @click="goDetail(staff)"
        >
          <div class="card-top">
            <div class="name-wrap">
              <img v-if="staff.avatar" :src="staff.avatar" class="avatar" alt="" />
              <div v-else class="avatar-placeholder">{{ (staff.full_name || '员').slice(0, 1) }}</div>
              <div class="name-info">
                <div class="full-name text-ellipsis">{{ staff.full_name || '-' }}</div>
                <div class="sub-line">
                  <span>工号 {{ staff.staff_code || '-' }}</span>
                  <span class="dot-sep">·</span>
                  <span>{{ staff.username || '-' }}</span>
                </div>
              </div>
            </div>
            <span class="top-status" :class="getStatusClass(staff.is_active)">
              {{ getStatusLabel(staff.is_active) }}
            </span>
          </div>

          <div class="card-main">
            <div class="meta-row">
              <van-icon name="phone-o" size="12" />
              <span>{{ staff.phone || '-' }}</span>
            </div>
            <div class="meta-row">
              <van-icon name="shop-o" size="12" />
              <span class="text-ellipsis">{{ staff.site_name || '-' }}</span>
            </div>
            <div class="group-list">
              <span
                v-for="name in toGroupList(staff.group_names)"
                :key="name"
                class="group-tag"
              >
                {{ name }}
              </span>
              <span v-if="toGroupList(staff.group_names).length === 0" class="group-empty">暂无权限组</span>
            </div>
          </div>

          <div class="card-footer">
            <button type="button" class="action-btn" @click.stop="goDetail(staff)">查看详情</button>
            <button
              type="button"
              class="action-btn"
              :class="staff.is_active ? 'action-btn-danger' : 'action-btn-primary'"
              @click.stop="toggleStaffStatus(staff)"
            >
              {{ staff.is_active ? '禁用账号' : '启用账号' }}
            </button>
          </div>
        </div>

        <template v-if="showEmpty" #finished>
          <div class="empty-wrap">
            <van-empty description="暂无员工" />
          </div>
        </template>
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<style scoped>
.page {
  min-height: 100%;
  background: var(--color-background);
}

.search-wrap {
  position: sticky;
  top: 0;
  z-index: 12;
  background: var(--color-background);
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

.status-tabs {
  display: flex;
  gap: 8px;
  padding: 0 10px 10px;
}

.status-tab-btn {
  border: 0;
  border-radius: 999px;
  height: 30px;
  padding: 0 14px;
  background: #ffffff;
  color: #6b7280;
  font-size: 12px;
}

.status-tab-btn.active {
  background: color-mix(in srgb, var(--color-primary) 16%, #ffffff);
  color: var(--color-primary);
}

.filter-popup {
  background: var(--color-background);
  padding: 10px 12px 14px;
}

.filter-section {
  margin-bottom: 8px;
}

.filter-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 10px;
}

.chip-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.filter-chip-btn {
  border: 0;
  background: #ffffff;
  color: #374151;
  height: 36px;
  border-radius: 18px;
  font-size: 13px;
}

.filter-chip-btn.active {
  background: color-mix(in srgb, var(--color-primary) 16%, #ffffff);
  color: var(--color-primary);
}

.filter-current {
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
}

.filter-actions {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.panel-btn {
  border: 0;
  height: 42px;
  border-radius: 22px;
  font-size: 18px;
  font-weight: 600;
}

.panel-btn-ghost {
  background: color-mix(in srgb, var(--color-primary) 10%, #ffffff);
  color: var(--color-primary);
}

.panel-btn-primary {
  background: var(--color-primary);
  color: #ffffff;
}

.list {
  padding: 8px 10px 20px;
  min-height: calc(100dvh - 140px);
}

.state-wrap,
.empty-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 46px 0;
}

.retry-btn {
  margin-top: 12px;
}

.staff-card {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #eef0f4;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.staff-card:active {
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

.name-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.avatar,
.avatar-placeholder {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  flex-shrink: 0;
}

.avatar {
  object-fit: cover;
  background: #f8fafc;
  border: 1px solid #eef0f4;
}

.avatar-placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #2563eb, #60a5fa);
}

.name-info {
  min-width: 0;
  flex: 1;
}

.full-name {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
}

.sub-line {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot-sep {
  color: #cbd5e1;
}

.top-status {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid currentColor;
}

.top-status.status-active {
  color: #059669;
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.top-status.status-inactive {
  color: #9ca3af;
  background: #f8fafc;
  border-color: #e5e7eb;
}

.card-main {
  padding: 10px 0;
  display: grid;
  gap: 6px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}

.group-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.group-tag {
  font-size: 11px;
  color: #0f172a;
  background: #f1f5f9;
  border-radius: 999px;
  padding: 2px 8px;
}

.group-empty {
  font-size: 12px;
  color: #9ca3af;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
}

.action-btn {
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #4b5563;
  font-size: 12px;
  border-radius: 999px;
  height: 28px;
  padding: 0 12px;
}

.action-btn-primary {
  border-color: #93c5fd;
  color: #1d4ed8;
  background: #eff6ff;
}

.action-btn-danger {
  border-color: #fecaca;
  color: #b91c1c;
  background: #fef2f2;
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
