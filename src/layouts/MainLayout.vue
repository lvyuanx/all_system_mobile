<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Tabbar 配置
const tabbarList = [
  {
    name: 'home',
    title: '首页',
    icon: 'home-o',
    path: '/home',
  },
  {
    name: 'category',
    title: '分类',
    icon: 'apps-o',
    path: '/category',
  },
  {
    name: 'profile',
    title: '我的',
    icon: 'user-o',
    path: '/profile',
  },
]

// 当前激活的 Tab
const activeTab = computed(() => {
  const tab = tabbarList.find((item) => item.path === route.path)
  return tab ? tab.name : 'home'
})

// Tab 点击事件
const onTabChange = (name) => {
  const tab = tabbarList.find((item) => item.name === name)
  if (tab) {
    router.push(tab.path)
  }
}

</script>

<template>
  <div class="main-layout">
    <!-- 顶部导航栏（无返回按钮） - 固定不参与动画 -->
    <div class="navbar-wrapper">
      <router-view v-slot="{ route: currentRoute }">
        <van-nav-bar
          v-if="currentRoute.meta.title"
          :title="currentRoute.meta.title"
          :fixed="true"
          :placeholder="true"
        />
      </router-view>
    </div>

    <!-- 页面内容区域（支持缓存） - 参与动画 -->
    <div class="page-container">
      <router-view v-slot="{ Component, route: currentRoute }">
        <keep-alive>
          <component
            :is="Component"
            v-if="currentRoute.meta.keepAlive"
            :key="currentRoute.fullPath"
            class="page-view"
          />
        </keep-alive>

        <component
          :is="Component"
          v-if="!currentRoute.meta.keepAlive"
          :key="currentRoute.fullPath"
          class="page-view"
        />
      </router-view>
    </div>

    <!-- 底部 Tabbar - 固定不参与动画 -->
    <div class="tabbar-wrapper">
      <van-tabbar v-model="activeTab" @change="onTabChange" safe-area-inset-bottom>
        <van-tabbar-item
          v-for="item in tabbarList"
          :key="item.name"
          :name="item.name"
          :icon="item.icon"
        >
          {{ item.title }}
        </van-tabbar-item>
      </van-tabbar>
    </div>
  </div>
</template>

<style scoped>
.main-layout {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.navbar-wrapper {
  position: relative;
  z-index: 100;
  flex-shrink: 0;
}

.page-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.page-view {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.tabbar-wrapper {
  position: relative;
  z-index: 100;
  flex-shrink: 0;
}
</style>
