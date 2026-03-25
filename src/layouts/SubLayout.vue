<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 是否显示返回按钮
const showBack = computed(() => {
  return route.meta.showBack !== false
})

// 返回上一页
const onClickLeft = () => {
  router.back()
}

// 页面标题
const title = computed(() => {
  return route.meta.title || '页面'
})

const onBeforeEnter = () => {
  document.body.classList.add('page-transitioning')
}

const onAfterEnter = () => {
  document.body.classList.remove('page-transitioning')
}
</script>

<template>
  <div class="sub-layout">
    <!-- 顶部导航栏 - 固定不参与动画 -->
    <div class="navbar-wrapper">
      <van-nav-bar
        :title="title"
        :left-arrow="showBack"
        :fixed="true"
        :placeholder="true"
        @click-left="onClickLeft"
      />
    </div>

    <!-- 页面内容区域 - 参与动画 -->
    <div class="content">
      <router-view v-slot="{ Component, route: currentRoute }">
        <transition
          :name="currentRoute.meta.pageTransition || 'ios-none'"
          mode="out-in"
          @before-enter="onBeforeEnter"
          @after-enter="onAfterEnter"
          @after-leave="onAfterEnter"
        >
          <component :is="Component" :key="currentRoute.fullPath" class="page-view" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<style scoped>
.sub-layout {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--color-background);
}

.navbar-wrapper {
  position: relative;
  z-index: 100;
  flex-shrink: 0;
}

.content {
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
</style>
