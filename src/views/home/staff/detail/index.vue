<script setup>
defineOptions({ name: 'StaffDetail' })

import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import {
  activateStaff,
  deactivateStaff,
  getStaffDetail,
  getStaffGroupOptions,
  updateStaffGroups,
} from '@/api/staff'

const route = useRoute()
const router = useRouter()

const userId = computed(() => Number(route.query.user_id || route.query.id || 0))

const detail = ref(null)
const groupOptions = ref([])
const selectedGroupIds = ref([])
const loading = ref(false)
const loadError = ref(false)
const savingGroups = ref(false)
const actionLoading = ref(false)

const statusClass = computed(() => (detail.value?.is_active ? 'status-active' : 'status-inactive'))
const statusText = computed(() => (detail.value?.is_active ? '账号已启用' : '账号已禁用'))
const navTitle = computed(() => route.query.name || '员工详情')

const normalizeGroupIds = (ids) => {
  if (!Array.isArray(ids)) return []
  return ids
    .map((id) => Number(id))
    .filter((id) => !Number.isNaN(id) && id > 0)
}

const parseGroupNames = (names) => {
  if (Array.isArray(names)) return names.filter(Boolean)
  if (typeof names === 'string') {
    return names
      .split(/[、,，]/)
      .map((name) => name.trim())
      .filter(Boolean)
  }
  return []
}

const selectedGroupNames = computed(() => {
  if (!selectedGroupIds.value.length) return []
  const selectedSet = new Set(selectedGroupIds.value)
  return groupOptions.value.filter((item) => selectedSet.has(item.value)).map((item) => item.label)
})

const fetchDetail = async () => {
  if (!userId.value) {
    showToast('缺少员工信息')
    router.back()
    return
  }

  loading.value = true
  loadError.value = false

  try {
    const [detailRes, groupRes] = await Promise.all([
      getStaffDetail(userId.value, { loading: false }),
      getStaffGroupOptions({ loading: false }),
    ])

    detail.value = detailRes?.data || null
    const groups = Array.isArray(groupRes?.data) ? groupRes.data : []
    groupOptions.value = groups.map((item) => ({
      value: Number(item.group_id),
      label: item.group_name || '-',
    }))

    selectedGroupIds.value = normalizeGroupIds(detail.value?.group_ids)
  } catch {
    detail.value = null
    loadError.value = true
  } finally {
    loading.value = false
  }
}

const onClickLeft = () => {
  const hasBack = Boolean(window.history.state?.back)
  if (hasBack) {
    router.back()
    return
  }
  router.replace('/home/staff')
}

const onToggleStatus = async () => {
  if (!detail.value || actionLoading.value) return

  const isActive = Boolean(detail.value.is_active)
  const actionText = isActive ? '禁用' : '启用'

  try {
    await showConfirmDialog({
      title: '提示',
      message: `确认${actionText}该员工账号？`,
    })
  } catch {
    return
  }

  actionLoading.value = true
  try {
    const api = isActive ? deactivateStaff : activateStaff
    await api({ user_id: detail.value.user_id }, { loading: false })
    showToast(`${actionText}成功`)
    await fetchDetail()
  } catch {
    // 错误由拦截器处理
  } finally {
    actionLoading.value = false
  }
}

const sameGroupSet = (a, b) => {
  if (a.length !== b.length) return false
  const x = [...a].sort((m, n) => m - n)
  const y = [...b].sort((m, n) => m - n)
  return x.every((item, index) => item === y[index])
}

const onSaveGroups = async () => {
  if (!detail.value || savingGroups.value) return

  const nextGroupIds = normalizeGroupIds(selectedGroupIds.value)
  const currentGroupIds = normalizeGroupIds(detail.value.group_ids)

  if (sameGroupSet(nextGroupIds, currentGroupIds)) {
    showToast('权限组未变化')
    return
  }

  try {
    await showConfirmDialog({
      title: '提示',
      message: '确认保存权限组设置？',
    })
  } catch {
    return
  }

  savingGroups.value = true
  try {
    await updateStaffGroups(
      {
        user_id: detail.value.user_id,
        group_ids: nextGroupIds,
      },
      { loading: false },
    )
    showToast('权限组更新成功')
    detail.value.group_ids = [...nextGroupIds]
    detail.value.group_names = [...selectedGroupNames.value]
  } catch {
    // 错误由拦截器处理
  } finally {
    savingGroups.value = false
  }
}

const pageRef = ref(null)
const isCollapsed = ref(false)
let lastScrollTop = 0
let rafId = null
const THRESHOLD = 8

const onScroll = () => {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    const el = pageRef.value
    if (!el) return
    const current = el.scrollTop
    const delta = current - lastScrollTop
    if (current <= 0) {
      isCollapsed.value = false
    } else if (delta > THRESHOLD) {
      isCollapsed.value = true
    } else if (delta < -THRESHOLD) {
      isCollapsed.value = false
    }
    lastScrollTop = current
  })
}

onMounted(() => {
  fetchDetail()
  pageRef.value?.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  pageRef.value?.removeEventListener('scroll', onScroll)
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div ref="pageRef" class="page">
    <div class="sticky-header" :class="statusClass">
      <div class="header-nav">
        <button class="back-btn" @click="onClickLeft">
          <van-icon name="arrow-left" size="20" />
        </button>
        <div class="header-title">{{ navTitle }}</div>
        <div class="header-nav-name" :class="{ visible: isCollapsed }">
          {{ detail?.full_name || '' }}
        </div>
      </div>
      <div class="header-status" :class="{ collapsed: isCollapsed }">
        <template v-if="detail">
          <img v-if="detail.avatar" :src="detail.avatar" class="header-avatar" alt="" />
          <div v-else class="header-avatar placeholder">{{ (detail.full_name || '员').slice(0, 1) }}</div>
          <div class="header-info">
            <div class="header-name">{{ detail.full_name || '-' }}</div>
            <div class="header-sub">工号 {{ detail.staff_code || '-' }}</div>
            <div class="header-sub">{{ detail.phone || '-' }}</div>
          </div>
          <div class="header-pill" :class="detail.is_active ? 'on' : 'off'">
            {{ detail.is_active ? '启用' : '禁用' }}
          </div>
        </template>
      </div>
    </div>

    <div v-if="loading" class="full-center">
      <van-loading size="28" color="#2563eb" vertical>加载中...</van-loading>
    </div>

    <div v-else-if="detail" class="content">
      <div class="card">
        <div class="card-header">
          <van-icon name="manager-o" class="card-icon" />
          <span class="card-title">账号状态</span>
        </div>
        <div class="status-block" :class="detail.is_active ? 'status-on' : 'status-off'">
          <van-icon :name="detail.is_active ? 'passed' : 'close'" size="14" />
          <span>{{ statusText }}</span>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <van-icon name="contact" class="card-icon" />
          <span class="card-title">员工信息</span>
        </div>
        <div class="info-list">
          <div class="info-row">
            <span class="info-key">姓名</span>
            <span class="info-val">{{ detail.full_name || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-key">用户名</span>
            <span class="info-val">{{ detail.username || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-key">工号</span>
            <span class="info-val">{{ detail.staff_code || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-key">手机号</span>
            <span class="info-val">{{ detail.phone || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-key">邮箱</span>
            <span class="info-val">{{ detail.email || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-key">性别</span>
            <span class="info-val">{{ detail.sex || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-key">年龄</span>
            <span class="info-val">{{ detail.age || '-' }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <van-icon name="shop-o" class="card-icon" />
          <span class="card-title">组织信息</span>
        </div>
        <div class="info-list">
          <div class="info-row">
            <span class="info-key">所属站点</span>
            <span class="info-val">{{ detail.site_name || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-key">姓</span>
            <span class="info-val">{{ detail.last_name || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-key">名</span>
            <span class="info-val">{{ detail.first_name || '-' }}</span>
          </div>
          <div class="info-row groups-row">
            <span class="info-key">当前权限组</span>
            <div class="tag-list">
              <span
                v-for="name in parseGroupNames(detail.group_names)"
                :key="name"
                class="group-tag"
              >
                {{ name }}
              </span>
              <span v-if="parseGroupNames(detail.group_names).length === 0" class="group-empty">暂无权限组</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <van-icon name="cluster-o" class="card-icon" />
          <span class="card-title">权限组设置</span>
        </div>

        <van-checkbox-group v-model="selectedGroupIds" class="group-check-wrap">
          <van-checkbox
            v-for="item in groupOptions"
            :key="item.value"
            :name="item.value"
            class="group-check-item"
            shape="square"
          >
            {{ item.label }}
          </van-checkbox>
        </van-checkbox-group>

        <div v-if="!groupOptions.length" class="group-empty large">暂无可选权限组</div>

        <van-button
          round
          block
          type="primary"
          class="save-btn"
          :loading="savingGroups"
          @click="onSaveGroups"
        >
          保存权限组
        </van-button>
      </div>
    </div>

    <div v-else-if="loadError" class="state-wrap">
      <van-empty image="error" description="员工详情加载失败，请稍后重试">
        <van-button round type="primary" class="retry-btn" @click="fetchDetail">重新加载</van-button>
      </van-empty>
    </div>

    <div v-else class="state-wrap">
      <van-empty description="暂无员工详情" />
    </div>

    <footer v-if="detail" class="footer-bar">
      <van-button
        round
        class="footer-btn"
        :class="detail.is_active ? 'footer-btn--danger' : 'footer-btn--primary'"
        :loading="actionLoading"
        @click="onToggleStatus"
      >
        {{ detail.is_active ? '禁用账号' : '启用账号' }}
      </van-button>
    </footer>
  </div>
</template>

<style scoped>
.page {
  --c-primary: #2563eb;
  --c-border: #e5e7eb;
  --c-text: #111827;
  --c-sub: #6b7280;
  --c-muted: #9ca3af;
  --c-bg: #f3f4f6;
  --c-card: #ffffff;
  --radius: 12px;
  --shadow: 0 1px 0 rgba(0, 0, 0, 0.06);

  min-height: 100vh;
  height: 100vh;
  overflow-y: auto;
  background: var(--c-bg);
  padding-bottom: calc(80px + env(safe-area-inset-bottom));
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 100;
  padding-top: env(safe-area-inset-top);
  overflow: hidden;
}

.sticky-header::after {
  content: '';
  position: absolute;
  right: -24px;
  top: -24px;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.sticky-header.status-active {
  background: linear-gradient(135deg, #0f766e, #14b8a6);
}

.sticky-header.status-inactive {
  background: linear-gradient(135deg, #64748b, #94a3b8);
}

.header-nav {
  height: 46px;
  display: grid;
  grid-template-columns: 44px 1fr auto;
  align-items: center;
  padding-right: 12px;
  position: relative;
  z-index: 1;
}

.back-btn {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.header-title {
  font-size: 17px;
  font-weight: 700;
  color: #fff;
}

.header-nav-name {
  max-width: 160px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.95);
  padding-right: 4px;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.25s ease, transform 0.25s ease;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-nav-name.visible {
  opacity: 1;
  transform: translateY(0);
}

.header-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 16px 18px;
  position: relative;
  z-index: 1;
  max-height: 120px;
  opacity: 1;
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.25s ease, padding 0.3s ease;
}

.header-status.collapsed {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.header-avatar {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.9);
}

.header-avatar.placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 22px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.22);
}

.header-info {
  min-width: 0;
  flex: 1;
}

.header-name {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-sub {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.header-pill {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid transparent;
}

.header-pill.on {
  background: rgba(236, 253, 245, 0.16);
  border-color: rgba(167, 243, 208, 0.75);
  color: #d1fae5;
}

.header-pill.off {
  background: rgba(248, 250, 252, 0.12);
  border-color: rgba(226, 232, 240, 0.65);
  color: #f1f5f9;
}

.full-center {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px 0;
}

.content {
  padding: 10px 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card {
  background: var(--c-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  padding: 14px 16px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.card-icon {
  font-size: 16px;
  color: var(--c-primary);
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--c-text);
}

.status-block {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}

.status-block.status-on {
  color: #059669;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}

.status-block.status-off {
  color: #64748b;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.info-list {
  display: flex;
  flex-direction: column;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--c-border);
  gap: 10px;
}

.info-row:last-child {
  border-bottom: none;
}

.groups-row {
  align-items: flex-start;
}

.info-key {
  font-size: 14px;
  color: var(--c-sub);
  flex-shrink: 0;
}

.info-val {
  font-size: 14px;
  color: var(--c-text);
  text-align: right;
  max-width: 68%;
  word-break: break-all;
}

.tag-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
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
  color: var(--c-muted);
}

.group-empty.large {
  padding: 8px 0 2px;
}

.group-check-wrap {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 8px;
}

.group-check-item {
  margin: 0;
  padding: 9px 10px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
}

.group-check-item :deep(.van-checkbox__label) {
  margin-left: 8px;
  font-size: 13px;
  color: #374151;
}

.save-btn {
  margin-top: 14px;
  height: 40px;
}

.state-wrap {
  padding: 40px 0;
}

.retry-btn {
  margin-top: 12px;
}

.footer-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid var(--c-border);
  backdrop-filter: blur(12px);
}

.footer-btn {
  flex: 1;
  height: 42px;
  font-size: 15px;
  font-weight: 600;
}

.footer-btn--primary {
  background: #2563eb !important;
  border-color: #2563eb !important;
  color: #fff !important;
}

.footer-btn--danger {
  background: #fef2f2 !important;
  border-color: #fecaca !important;
  color: #b91c1c !important;
}
</style>
