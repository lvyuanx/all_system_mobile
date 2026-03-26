<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const topActions = ref([
  { key: 'pending', icon: 'todo-list-o', text: '待处理订单', path: '/home/detail' },
  { key: 'ship', icon: 'logistics', text: '发货管理', path: '/home/detail' },
  { key: 'refund', icon: 'after-sale', text: '售后处理', path: '/home/detail' },
  { key: 'stock', icon: 'cluster-o', text: '库存管理', path: '/home/detail' },
])

const userTools = ref([
  { key: 'orders', icon: 'orders-o', text: '订单总览', path: '/home/detail' },
  { key: 'records', icon: 'clock-o', text: '操作记录', path: '/home/detail' },
  { key: 'account', icon: 'setting-o', text: '账号管理', path: '/profile/settings' },
  { key: 'orders', icon: 'orders-o', text: '订单总览', path: '/home/detail' },
  { key: 'records', icon: 'clock-o', text: '操作记录', path: '/home/detail' },
  { key: 'account', icon: 'setting-o', text: '账号管理', path: '/profile/settings' },
  { key: 'orders', icon: 'orders-o', text: '订单总览', path: '/home/detail' },
  { key: 'records', icon: 'clock-o', text: '操作记录', path: '/home/detail' },
])

// 获取用户昵称
const nickname = computed(() => userStore.userInfo.nickname || '用户')

const goAction = (path) => {
  router.push(path)
}

const goLogout = () => {
  showConfirmDialog({
    title: '退出登录',
    message: '确认退出当前账号吗？',
  })
    .then(() => {
      userStore.logout()
      showToast('已退出登录')
      router.replace('/login')
    })
    .catch(() => { })
}
</script>

<template>
  <div class="home-page">
    <!-- 动态背景光斑 -->
    <div class="aurora">
      <div class="aurora-blob blob-1"></div>
      <div class="aurora-blob blob-2"></div>
    </div>

    <section class="hero">
      <div class="hero-main">
        <div class="hello">HELLO，</div>
        <div class="welcome-line">
          <span class="welcome-text">欢迎使用</span>
          <span class="tag">订单管理</span>
        </div>
      </div>
    </section>

    <section class="quick-actions">
      <div v-for="item in topActions" :key="item.key" class="quick-item" @click="goAction(item.path)">
        <div class="quick-icon-wrap">
          <van-icon :name="item.icon" />
        </div>
        <span>{{ item.text }}</span>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div class="username">{{ nickname }}</div>
        <button class="logout-btn" @click="goLogout">
          <van-icon name="contact-o" />
          <span>退出登录</span>
        </button>
      </div>

      <div class="tool-grid">
        <div v-for="item in userTools" :key="item.key" class="tool-item" @click="goAction(item.path)">
          <div class="tool-icon">
            <van-icon :name="item.icon" />
          </div>
          <span>{{ item.text }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  position: relative;
  min-height: 100%;
  background: linear-gradient(180deg, #e8f4ff 0%, #f0f7ff 30%, #f7f9fc 100%);
  overflow-x: hidden;
}

/* 动态极光背景 */
.aurora {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.aurora-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.4;
  will-change: transform;
}

.blob-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  right: -80px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, rgba(96, 165, 250, 0.2) 50%, transparent 100%);
  animation: driftA 15s ease-in-out infinite;
}

.blob-2 {
  width: 250px;
  height: 250px;
  bottom: 100px;
  left: -100px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(167, 139, 250, 0.15) 50%, transparent 100%);
  animation: driftB 18s ease-in-out infinite 2s;
}

@keyframes driftA {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-30px, 20px) scale(1.1); }
}

@keyframes driftB {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(20px, -30px) scale(1.05); }
}

.hero {
  position: relative;
  z-index: 1;
  padding: 14px 16px 28px;
  background: transparent;
}

.hero-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-icon {
  font-size: 24px;
  color: #2f8cff;
}

.brand {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
}

.hero-main {
  margin-top: 30px;
}

.hello {
  font-size: 58px;
  font-weight: 700;
  line-height: 1;
  color: #1f2937;
}

.welcome-line {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.welcome-text {
  font-size: 44px;
  line-height: 1;
  font-weight: 700;
  color: #1f2937;
}

.tag {
  padding: 8px 18px;
  border-radius: 10px;
  font-size: 34px;
  line-height: 1;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(90deg, #0b91ff 0%, #26c8f8 100%);
}

.quick-actions {
  position: relative;
  z-index: 1;
  margin: 14px 12px 0;
  display: flex;
  gap: 10px;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.quick-actions::-webkit-scrollbar {
  display: none;
}

.quick-item {
  flex: 0 0 calc((100% - 20px) / 3);
  min-width: calc((100% - 20px) / 3);
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  padding: 14px 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #1f2937;
  box-shadow: 0 2px 12px rgba(59, 130, 246, 0.06);
  transition: all 0.2s ease;
}

.quick-item:active {
  transform: scale(0.98);
  background: rgba(255, 255, 255, 0.85);
}

.quick-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
}

.panel {
  position: relative;
  z-index: 1;
  margin: 14px 12px;
  padding: 14px 12px 20px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(59, 130, 246, 0.06), 0 1px 4px rgba(0, 0, 0, 0.02);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.username {
  font-size: 34px;
  font-weight: 700;
  color: #1f2937;
}

.logout-btn {
  border: none;
  background: transparent;
  color: #3b82f6;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.logout-btn:active {
  background: rgba(59, 130, 246, 0.1);
}

.tool-grid {
  margin-top: 22px;
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
  font-size: 13px;
  border-radius: 12px;
  transition: background 0.2s ease;
}

.tool-item:active {
  background: rgba(59, 130, 246, 0.06);
}

.tool-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  transition: all 0.2s ease;
}

.tool-item:active .tool-icon {
  transform: scale(0.95);
}
</style>
