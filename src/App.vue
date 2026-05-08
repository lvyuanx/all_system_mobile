<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppCustomNavBar from '@/components/AppCustomNavBar.vue'
import { consumeNextTransition, goBackWithTransition, NAVIGATION_TRANSITION } from '@/utils/navigationTransition'

import 'vant/lib/index.css'

const router = useRouter()
const route = useRoute()
const transitionName = ref('ios-none')

const lastHistoryPosition = ref(window.history.state?.position ?? 0)

const tabbarList = [
  { name: 'home', title: '首页', icon: 'home-o', path: '/home' },
  { name: 'profile', title: '我的', icon: 'user-o', path: '/profile' },
]

const activeTab = computed(() => {
  const tab = tabbarList.find((item) => item.path === route.path)
  return tab ? tab.name : 'home'
})

const isAppNavVisible = (targetRoute) => {
  if (targetRoute.meta?.showNavBar === false) return false
  return !['/home', '/profile'].includes(targetRoute.path)
}

const pageViewStyle = (targetRoute) => ({
  paddingTop: isAppNavVisible(targetRoute) ? 'calc(46px + env(safe-area-inset-top))' : '0px',
})

const showTabbar = computed(() => route.meta.showTabbar === true)
const showNavBar = computed(() => isAppNavVisible(route))
const navBarTitle = computed(() => route.query.name || route.meta.title || '页面')
const navBarShowBack = computed(() => route.meta.showBack !== false)
const navBarBackground = computed(() => route.meta.navBarBackground || 'var(--color-background)')

router.beforeEach((to, from, next) => {
  const requestedTransition = consumeNextTransition()
  const historyPosition = window.history.state?.position
  const hasHistoryPosition = typeof historyPosition === 'number'

  if (requestedTransition === NAVIGATION_TRANSITION.BACK) {
    transitionName.value = NAVIGATION_TRANSITION.BACK
    next()
    return
  }

  if (!from.name) {
    transitionName.value = NAVIGATION_TRANSITION.NONE
    if (hasHistoryPosition) lastHistoryPosition.value = historyPosition
    next()
    return
  }

  // Query 参数变化不触发方向动画，避免“重进页面”感
  if (to.path === from.path) {
    transitionName.value = NAVIGATION_TRANSITION.NONE
    if (hasHistoryPosition) lastHistoryPosition.value = historyPosition
    next()
    return
  }

  if (hasHistoryPosition && historyPosition < lastHistoryPosition.value) {
    transitionName.value = NAVIGATION_TRANSITION.BACK
  } else {
    transitionName.value = NAVIGATION_TRANSITION.FORWARD
  }

  next()
})

router.afterEach(() => {
  const historyPosition = window.history.state?.position
  if (typeof historyPosition === 'number') {
    lastHistoryPosition.value = historyPosition
  }
})

const cachedComponents = computed(() => {
  // level > 1 的非动态页面都缓存；Menu 页因 query 变化用 watch 刷新，也缓存
  return ['HomeIndex', 'HomeMenu', 'ClientList', 'StaffList', 'OrderCreate']
})

const onTabChange = (name) => {
  const tab = tabbarList.find((item) => item.name === name)
  if (tab && tab.path !== route.path) {
    // Tab 切换不入历史，避免重复点击后动画方向错乱
    router.replace(tab.path)
  }
}

const onBeforeEnter = () => {
  document.body.classList.add('page-transitioning')
}

const onAfterEnter = () => {
  document.body.classList.remove('page-transitioning')
}

const onClickNavLeft = () => {
  const fallbackPath = route.meta.parentPath || '/home'
  goBackWithTransition(router, fallbackPath)
}
</script>

<template>
  <div class="app-shell">
    <transition name="nav-fade">
      <div v-if="showNavBar" class="navbar-wrapper">
        <AppCustomNavBar
          :title="navBarTitle"
          :show-back="navBarShowBack"
          :background="navBarBackground"
          @click-left="onClickNavLeft"
        />
      </div>
    </transition>

    <div class="content-wrapper">
      <router-view v-slot="{ Component, route: currentRoute }">
        <transition
          :name="transitionName"
          @before-enter="onBeforeEnter"
          @after-enter="onAfterEnter"
          @after-leave="onAfterEnter"
        >
          <keep-alive :include="cachedComponents">
            <component
              :is="Component"
              :key="
                cachedComponents.includes(Component?.name)
                  ? Component?.name
                  : currentRoute.meta?.stableKeyByPath
                    ? currentRoute.path
                    : currentRoute.fullPath
              "
              class="page-view"
              :style="pageViewStyle(currentRoute)"
            />
          </keep-alive>
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
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 120;
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
  box-sizing: border-box;
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

.tabbar-wrapper :deep(.van-tabbar-item) {
  padding-top: 10px;
  padding-bottom: 12px;
}

.ios-forward-enter-active,
.ios-forward-leave-active,
.ios-back-enter-active,
.ios-back-leave-active {
  position: absolute;
  inset: 0;
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
  position: absolute;
  inset: 0;
  transition: none;
}

.page-transitioning {
  pointer-events: none;
}

.nav-fade-enter-active,
.nav-fade-leave-active {
  transition: opacity 180ms ease;
}

.nav-fade-enter-from,
.nav-fade-leave-to {
  opacity: 0;
}
</style>
