<script setup>
defineOptions({ name: 'HomeMenu' })
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { fetchMenus, preloadMenus } from '@/utils/menuCache'

const route = useRoute()
const router = useRouter()

const menus = ref([])
const loading = ref(false)
const navTitle = computed(() => route.query.name || '功能菜单')

const onClickLeft = () => {
  const hasBack = Boolean(window.history.state?.back)
  if (hasBack) {
    router.back()
    return
  }
  router.replace('/home')
}

const loadMenus = async () => {
  if (route.path !== '/home/menu') return
  const parentId = route.query.id ? Number(route.query.id) : null
  const cached = await fetchMenus(parentId).catch(() => [])
  if (menus.value !== cached) {
    loading.value = menus.value.length === 0
    menus.value = cached
    loading.value = false
  }

  cached.forEach((item) => {
    if (!item.url) preloadMenus(item.id)
  })
}

onMounted(() => {
  loadMenus()
})

watch(
  () => [route.path, route.query.id],
  () => {
    if (route.path !== '/home/menu') return
    loadMenus()
  },
)

const goAction = async (item) => {
  if (item.url) {
    router.push(item.url.trim().replace(/_/g, '-'))
    return
  }

  const children = await fetchMenus(item.id).catch(() => [])
  if (children.length === 0) {
    showToast('未找到相关功能')
  } else {
    router.push({ path: '/home/menu', query: { id: item.id, name: item.text } })
  }
}
</script>

<template>
  <div class="menu-page">
    <van-nav-bar
      :title="navTitle"
      left-arrow
      fixed
      placeholder
      @click-left="onClickLeft"
    />

    <div class="menu-body">
      <van-loading v-if="loading" class="page-loading" color="#2563eb" />
      <template v-else-if="menus.length">
        <div class="tool-grid">
          <div v-for="item in menus" :key="item.id" class="tool-item" @click="goAction(item)">
            <div class="tool-icon">
              <van-icon :name="item.icon" />
            </div>
            <span>{{ item.text }}</span>
          </div>
        </div>
      </template>
      <van-empty v-else description="暂无菜单" />
    </div>
  </div>
</template>

<style scoped>
.menu-page {
  min-height: 100%;
  background: #f7f8fa;
}

.menu-page :deep(.van-nav-bar) {
  background: #f7f8fa;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: none;
}

.menu-page :deep(.van-nav-bar__content) {
  background: #f7f8fa;
}

.menu-page :deep(.van-nav-bar::after) {
  border: 0;
}

.menu-page :deep(.van-nav-bar__title) {
  font-weight: 600;
  color: #1f2937;
}

.menu-page :deep(.van-icon-arrow-left) {
  color: #334155;
}

.menu-body {
  padding: 12px;
}

.page-loading {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 0;
  color: #111827;
  font-size: 11px;
  border-radius: 12px;
  background: #fff;
  transition: background 0.2s ease;
}

.tool-item:active {
  background: rgba(59, 130, 246, 0.06);
}

.tool-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  transition: all 0.2s ease;
}

.tool-item:active .tool-icon {
  transform: scale(0.95);
}
</style>
