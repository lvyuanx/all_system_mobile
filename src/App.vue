<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import 'vant/lib/index.css'

const router = useRouter()
const route = useRoute()
const transitionName = ref('ios-none')

const pageStack = []

const tabbarList = [
  { name: 'home', title: '首页', icon: 'home-o', path: '/home' },
  { name: 'category', title: '分类', icon: 'apps-o', path: '/category' },
  { name: 'profile', title: '我的', icon: 'user-o', path: '/profile' },
]

const activeTab = computed(() => {
  const tab = tabbarList.find((item) => item.path === route.path)
  return tab ? tab.name : 'home'
})

const showTabbar = computed(() => route.meta.showTabbar === true)
const showBack = computed(() => route.meta.showBack === true)

router.beforeEach((to, from, next) => {
  const toPath = to.fullPath
  const fromPath = from.fullPath
  const toLevel = Number(to.meta?.level || 0)
  const fromLevel = Number(from.meta?.level || 0)

  if (!from.name) {
    transitionName.value = 'ios-none'
    if (!pageStack.includes(toPath)) pageStack.push(toPath)
    next()
    return
  }

  if (toLevel === 1 && fromLevel === 1) {
    transitionName.value = 'ios-none'
    const existed = pageStack.lastIndexOf(toPath)
    if (existed === -1) {
      pageStack.push(toPath)
    } else {
      pageStack.splice(existed + 1)
    }
    next()
    return
  }

  const toIndex = pageStack.lastIndexOf(toPath)
  const fromIndex = pageStack.lastIndexOf(fromPath)

  if (toIndex !== -1 && toIndex < fromIndex) {
    transitionName.value = 'ios-back'
    pageStack.splice(toIndex + 1)
  } else {
    transitionName.value = toLevel < fromLevel ? 'ios-back' : 'ios-forward'
    if (toIndex === -1) {
      pageStack.push(toPath)
    } else {
      pageStack.splice(toIndex + 1)
    }
  }

  next()
})

const onTabChange = (name) => {
  const tab = tabbarList.find((item) => item.name === name)
  if (tab) {
    router.push(tab.path)
  }
}

const onClickLeft = () => {
  router.back()
}

const onBeforeEnter = () => {
  document.body.classList.add('page-transitioning')
}

const onAfterEnter = () => {
  document.body.classList.remove('page-transitioning')
}
</script>

<template>
  <div class="app-shell">
    <div class="navbar-wrapper">
      <van-nav-bar
        v-if="route.meta.title"
        :title="route.meta.title"
        :left-arrow="showBack"
        :fixed="true"
        :placeholder="true"
        @click-left="onClickLeft"
      />
    </div>

    <div class="content-wrapper">
      <router-view v-slot="{ Component, route: currentRoute }">
        <transition
          :name="transitionName"
          @before-enter="onBeforeEnter"
          @after-enter="onAfterEnter"
          @after-leave="onAfterEnter"
        >
          <keep-alive v-if="currentRoute.meta.keepAlive">
            <component :is="Component" :key="currentRoute.fullPath" class="page-view" />
          </keep-alive>
          <component v-else :is="Component" :key="currentRoute.fullPath" class="page-view" />
        </transition>
      </router-view>
    </div>

    <div v-if="showTabbar" class="tabbar-wrapper">
      <van-tabbar
        v-model="activeTab"
        active-color="var(--color-primary)"
        inactive-color="var(--color-text-light)"
        @change="onTabChange"
        safe-area-inset-bottom
      >
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

<style>
.app-shell {
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

.content-wrapper {
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
  background-color: var(--color-card);
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.tabbar-wrapper {
  position: relative;
  z-index: 100;
  flex-shrink: 0;
  height: calc(var(--van-tabbar-height) + env(safe-area-inset-bottom));
}

.ios-forward-enter-active,
.ios-forward-leave-active,
.ios-back-enter-active,
.ios-back-leave-active {
  transition: transform 300ms cubic-bezier(0.32, 0.72, 0, 1);
  will-change: transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  contain: layout paint style;
}

.ios-forward-enter-active {
  z-index: 3;
}

.ios-forward-leave-active {
  z-index: 2;
  pointer-events: none;
}

.ios-back-enter-active {
  z-index: 2;
}

.ios-back-leave-active {
  z-index: 3;
  pointer-events: none;
}

.ios-forward-enter-from {
  transform: translate3d(100%, 0, 0);
}

.ios-forward-enter-to,
.ios-forward-leave-from,
.ios-back-enter-to,
.ios-back-leave-from {
  transform: translate3d(0, 0, 0);
}

.ios-forward-leave-to {
  transform: translate3d(-28%, 0, 0);
}

.ios-back-enter-from {
  transform: translate3d(-28%, 0, 0);
}

.ios-back-leave-to {
  transform: translate3d(100%, 0, 0);
}

.ios-none-enter-active,
.ios-none-leave-active {
  transition: none;
}

.page-transitioning {
  pointer-events: none;
}
</style>
