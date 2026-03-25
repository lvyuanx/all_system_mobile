<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 用户信息
const userInfo = ref({
  name: '用户昵称',
  avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/user.jpeg',
  vip: false,
})

// 功能列表
const menuList = ref([
  { icon: 'balance-o', text: '我的订单', path: '/detail' },
  { icon: 'coupon-o', text: '优惠券', path: '/detail' },
  { icon: 'location-o', text: '收货地址', path: '/detail' },
  { icon: 'service-o', text: '联系客服', path: '/detail' },
])

// 系统设置
const settingsList = ref([
  { icon: 'setting-o', text: '设置', path: '/settings' },
  { icon: 'info-o', text: '关于我们', path: '/detail' },
])

// 菜单点击事件
const handleMenuClick = (item) => {
  router.push(item.path)
}

// 退出登录
const handleLogout = () => {
  vant.showConfirmDialog({
    title: '提示',
    message: '确定要退出登录吗？',
  })
    .then(() => {
      vant.showToast('已退出登录')
    })
    .catch(() => {
      // 取消
    })
}
</script>

<template>
  <div class="profile-page">
    <!-- 用户信息卡片 -->
    <van-cell-group inset class="user-card">
      <van-cell center :border="false">
        <template #title>
          <van-image
            round
            width="60"
            height="60"
            :src="userInfo.avatar"
            fit="cover"
            class="avatar"
          />
          <span class="username">{{ userInfo.name }}</span>
        </template>
        <template #right-icon>
          <van-tag type="danger" v-if="userInfo.vip">VIP</van-tag>
        </template>
      </van-cell>
    </van-cell-group>

    <!-- 功能菜单 -->
    <van-cell-group inset title="我的服务" class="menu-section">
      <van-cell
        v-for="item in menuList"
        :key="item.text"
        :title="item.text"
        :icon="item.icon"
        is-link
        @click="handleMenuClick(item)"
      />
    </van-cell-group>

    <!-- 系统设置 -->
    <van-cell-group inset title="系统设置" class="settings-section">
      <van-cell
        v-for="item in settingsList"
        :key="item.text"
        :title="item.text"
        :icon="item.icon"
        is-link
        @click="handleMenuClick(item)"
      />
    </van-cell-group>

    <!-- 退出按钮 -->
    <div class="logout-section">
      <van-button block type="danger" @click="handleLogout">退出登录</van-button>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100%;
  padding: 12px;
  padding-bottom: calc(12px + constant(safe-area-inset-bottom));
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  background-color: var(--color-background);
}

.user-card {
  margin-bottom: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.user-card :deep(.van-cell) {
  background: transparent;
  color: #fff;
}

.user-card :deep(.van-cell__right-icon) {
  color: #fff;
}

.avatar {
  margin-right: 12px;
  border: 2px solid #fff;
}

.username {
  font-size: 18px;
  font-weight: 500;
}

.menu-section,
.settings-section {
  margin-bottom: 12px;
}

.logout-section {
  margin-top: 24px;
  padding: 0 12px;
}
</style>
