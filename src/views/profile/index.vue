<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { mobileLogout } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const workAge = computed(() => {
  const dateJoined = userStore.userInfo.date_joined
  if (!dateJoined) return ''
  const joined = new Date(dateJoined)
  const now = new Date()
  const months = (now.getFullYear() - joined.getFullYear()) * 12 + (now.getMonth() - joined.getMonth())
  if (months < 12) return `${months || 1}个月`
  return `${Math.floor(months / 12)}年`
})

const menuList = [
  { icon: 'contact-o', text: '个人信息', path: '/profile/info' },
  { icon: 'lock', text: '密码修改', path: '/profile/password' },
]

const settingsList = [
  { icon: 'setting-o', text: '设置', path: '/profile/settings' },
  { icon: 'info-o', text: '关于我们', path: '/home/detail' },
]

const handleMenuClick = (item) => {
  router.push(item.path)
}

const handleLogout = () => {
  showConfirmDialog({
    title: '提示',
    message: '确定要退出登录吗？',
  })
    .then(() => {
      mobileLogout()
        .then(() => {
          userStore.logout()
          showToast('已退出登录')
          router.replace('/login')
        })
        .catch(() => {
          showToast('退出登录失败，请重试')
        })
    })
    .catch(() => {})
}
</script>

<template>
  <div class="profile-page">

    <!-- Hero 区域 -->
    <div class="hero">
      <!-- 装饰圆 -->
      <div class="deco-circle c1" />
      <div class="deco-circle c2" />

      <!-- 头像 -->
      <div class="avatar-wrap" @click="router.push('/profile/avatar')">
        <van-image
          round
          width="88"
          height="88"
          :src="userStore.userInfo.avatar || '/static/images/default/user_default.png'"
          fit="cover"
          class="avatar"
        />
        <div class="avatar-edit-badge">
          <van-icon name="photograph" size="12" />
        </div>
      </div>

      <!-- 用户信息 -->
      <div class="hero-name">{{ userStore.userInfo.nickname || userStore.userInfo.username }}</div>
      <div class="hero-meta">
        <span class="role-badge" :class="{ superuser: userStore.userInfo.is_superuser }">
          {{ userStore.userInfo.is_superuser ? '超级管理员' : '普通用户' }}
        </span>
        <span v-if="workAge" class="work-age-badge">
          <van-icon name="clock-o" />
          工龄 {{ workAge }}
        </span>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="content">
      <van-cell-group inset class="cell-group">
        <template #title><span class="group-title">我的服务</span></template>
        <van-cell
          v-for="item in menuList"
          :key="item.text"
          :title="item.text"
          :icon="item.icon"
          is-link
          @click="handleMenuClick(item)"
        />
      </van-cell-group>

      <van-cell-group inset class="cell-group">
        <template #title><span class="group-title">系统设置</span></template>
        <van-cell
          v-for="item in settingsList"
          :key="item.text"
          :title="item.text"
          :icon="item.icon"
          is-link
          @click="handleMenuClick(item)"
        />
      </van-cell-group>

      <div class="logout-wrap">
        <button class="logout-btn" @click="handleLogout">退出登录</button>
      </div>
    </div>

  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100%;
  background: #f2f3f7;
  padding-bottom: calc(32px + env(safe-area-inset-bottom));
  padding-bottom: calc(32px + constant(safe-area-inset-bottom));
}

/* ── Hero ── */
.hero {
  position: relative;
  overflow: hidden;
  background: linear-gradient(145deg, #5b6ef5 0%, #8b5cf6 60%, #c084fc 100%);
  padding: 52px 24px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  /* 底部波浪裁剪 */
  border-radius: 0 0 36px 36px;
}

.deco-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.15;
  background: #fff;
}
.c1 {
  width: 180px;
  height: 180px;
  top: -60px;
  right: -40px;
}
.c2 {
  width: 120px;
  height: 120px;
  bottom: -20px;
  left: -30px;
}

.avatar-wrap {
  position: relative;
  width: 92px;
  height: 92px;
  border-radius: 50%;
  padding: 3px;
  background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.4) 100%);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

.avatar-edit-badge {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  color: #5b6ef5;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  border: 1.5px solid rgba(91,110,245,0.2);
}

.avatar {
  display: block;
  border-radius: 50%;
}

.hero-name {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
  text-shadow: 0 1px 6px rgba(0,0,0,0.15);
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.2);
  color: rgba(255,255,255,0.95);
  border: 1px solid rgba(255,255,255,0.35);
  letter-spacing: 0.5px;
}

.role-badge.superuser {
  background: rgba(255, 196, 0, 0.25);
  color: #ffe566;
  border-color: rgba(255, 220, 0, 0.45);
}

.work-age-badge {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: rgba(255,255,255,0.75);
}

/* ── Content ── */
.content {
  padding: 20px 0 0;
}

.cell-group {
  margin-bottom: 12px;
}

.group-title {
  font-size: 13px;
  font-weight: 600;
  color: #888;
  letter-spacing: 0.5px;
}

/* cell 图标颜色 */
.cell-group :deep(.van-cell__left-icon) {
  color: #5b6ef5;
}

/* ── 退出按钮 ── */
.logout-wrap {
  padding: 8px 16px 0;
}

.logout-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(90deg, #ff5858 0%, #f857a6 100%);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  box-shadow: 0 6px 20px rgba(248, 87, 166, 0.35);
  cursor: pointer;
  transition: opacity 0.15s;
}

.logout-btn:active {
  opacity: 0.85;
}
</style>
