<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

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
  { key: 'account', icon: 'setting-o', text: '账号管理', path: '/profile/settings' },
  { key: 'orders', icon: 'orders-o', text: '订单总览', path: '/home/detail' },
  { key: 'records', icon: 'clock-o', text: '操作记录', path: '/home/detail' },
  { key: 'account', icon: 'setting-o', text: '账号管理', path: '/profile/settings' },
  { key: 'orders', icon: 'orders-o', text: '订单总览', path: '/home/detail' },
  { key: 'records', icon: 'clock-o', text: '操作记录', path: '/home/detail' },
  { key: 'account', icon: 'setting-o', text: '账号管理', path: '/profile/settings' },
  { key: 'orders', icon: 'orders-o', text: '订单总览', path: '/home/detail' },
  { key: 'records', icon: 'clock-o', text: '操作记录', path: '/home/detail' },
  { key: 'account', icon: 'setting-o', text: '账号管理', path: '/profile/settings' },
])

const goAction = (path) => {
  router.push(path)
}

const goLogout = () => {
  vant.showConfirmDialog({
    title: '退出登录',
    message: '确认退出当前账号吗？',
  })
    .then(() => {
      vant.showToast('已退出登录')
      router.push('/profile')
    })
    .catch(() => { })
}
</script>

<template>
  <div class="home-page">
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
        <div class="username">吕元祥</div>
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
  min-height: 100%;
  background: #f7f9fc;
}

.hero {
  padding: 14px 16px 28px;
  background: linear-gradient(180deg, #d7ebff 0%, #e9f3ff 52%, #eef6ff 100%);
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
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
  background: #fff;
  border-radius: 10px;
  padding: 14px 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  color: #1f2937;
  box-shadow: 0 2px 8px rgba(20, 43, 80, 0.05);
}

.quick-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid #dfe8f7;
  background: linear-gradient(180deg, #f9fbff 0%, #edf3ff 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
  color: #1989fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.panel {
  margin: 14px 12px;
  padding: 14px 12px 20px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(20, 43, 80, 0.06);
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
  color: #2f8cff;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tool-grid {
  margin-top: 22px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 0;
  color: #111827;
  font-size: 16px;
}

.tool-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid #dfe8f7;
  background: linear-gradient(180deg, #f9fbff 0%, #edf3ff 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
  color: #1989fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
</style>
