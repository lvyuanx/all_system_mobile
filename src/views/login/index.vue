<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import SlideToLogin from './components/SlideToLogin.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const loading = ref(false)
const slideLoginRef = ref(null)

const form = reactive({
  username: '',
  password: '',
})

const resetSlider = () => {
  window.setTimeout(() => {
    slideLoginRef.value?.reset()
  }, 120)
}

const onLogin = async () => {
  if (loading.value) return

  if (!form.username.trim() || !form.password.trim()) {
    showToast('登录信息不能为空')
    resetSlider()
    return
  }

  loading.value = true

  try {
    await new Promise((resolve) => setTimeout(resolve, 500))
    // 调用 store 的 login 方法
    userStore.login({
      username: form.username,
      nickname: form.username,
    })
    showToast('登录成功')
    // 跳转到原来要访问的页面，或首页
    const redirect = route.query.redirect || '/home'
    router.replace(redirect)
  } finally {
    loading.value = false
    resetSlider()
  }
}
</script>

<template>
  <div class="login-page">
    <!-- 动态背景光斑 -->
    <div class="aurora">
      <div class="aurora-blob blob-1"></div>
      <div class="aurora-blob blob-2"></div>
      <div class="aurora-blob blob-3"></div>
      <div class="aurora-blob blob-4"></div>
    </div>

    <!-- 噪点纹理遮罩 -->
    <div class="noise-mask"></div>

    <!-- 内容层 -->
    <div class="content-layer">
      <!-- 品牌 Logo -->
      <div class="brand-area">
        <div class="logo-glass">
          <van-icon name="shield-o" class="logo-icon" />
          <div class="logo-glow"></div>
        </div>
        <h1 class="brand-title">订单管理系统</h1>
        <p class="brand-en">ORDER · MANAGEMENT · SYSTEM</p>
      </div>

      <!-- 毛玻璃登录卡片 -->
      <div class="glass-card">
        <!-- 卡片内部高光 -->
        <div class="card-highlight"></div>

        <div class="card-header">
          <div class="header-top-row">
            <h2 class="card-title">欢迎回来</h2>
            <div class="header-badge">
              <span class="badge-dot"></span>
              安全登录
            </div>
          </div>
          <p class="card-desc">请验证您的身份以继续</p>
        </div>

        <div class="form-body">
          <!-- 用户名 -->
          <div class="field-item">
            <div class="field-label">
              <van-icon name="contact-o" />
              <span>用户名</span>
            </div>
            <div class="field-input-wrap">
              <input
                v-model="form.username"
                type="text"
                placeholder="请输入用户名"
                autocomplete="username"
                class="field-input"
              />
              <div class="field-border"></div>
            </div>
          </div>

          <!-- 密码 -->
          <div class="field-item">
            <div class="field-label">
              <van-icon name="lock" />
              <span>密码</span>
            </div>
            <div class="field-input-wrap">
              <input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                autocomplete="current-password"
                class="field-input"
              />
              <div class="field-border"></div>
            </div>
          </div>
        </div>

        <!-- 分隔线 -->
        <div class="divider">
          <span class="divider-line"></span>
          <span class="divider-text">滑动验证</span>
          <span class="divider-line"></span>
        </div>

        <!-- 滑动登录 -->
        <div class="slide-area" :class="{ loading }">
          <SlideToLogin ref="slideLoginRef" :loading="loading" @action-login="onLogin" />
        </div>
      </div>

      <!-- 底部 -->
      <div class="page-footer">
        <span class="footer-dot"></span>
        <span>© 2025 订单管理系统</span>
        <span class="footer-dot"></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* =====================
   页面根容器
   ===================== */
.login-page {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: linear-gradient(180deg, #e8f4ff 0%, #f0f7ff 30%, #f7f9fc 100%);
  max-width: 430px;
  margin: 0 auto;
  left: 0;
  right: 0;
}

/* =====================
   动态极光背景
   ===================== */
.aurora {
  position: fixed;
  inset: 0;
  max-width: 430px;
  margin: 0 auto;
  left: 0;
  right: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.aurora-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(72px);
  opacity: 0.7;
  will-change: transform;
}

.blob-1 {
  width: 280px;
  height: 280px;
  top: -60px;
  left: -40px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(96, 165, 250, 0.2) 60%, transparent 100%);
  animation: driftA 12s ease-in-out infinite;
}

.blob-2 {
  width: 240px;
  height: 240px;
  top: 30px;
  right: -50px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, rgba(167, 139, 250, 0.15) 60%, transparent 100%);
  animation: driftB 14s ease-in-out infinite 2s;
}

.blob-3 {
  width: 320px;
  height: 200px;
  bottom: 80px;
  left: -60px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.35) 0%, rgba(56, 189, 248, 0.15) 60%, transparent 100%);
  animation: driftC 16s ease-in-out infinite 1s;
}

.blob-4 {
  width: 200px;
  height: 220px;
  bottom: 40px;
  right: -30px;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.3) 0%, rgba(139, 92, 246, 0.12) 60%, transparent 100%);
  animation: driftA 10s ease-in-out infinite reverse 3s;
}

@keyframes driftA {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%       { transform: translate(30px, 20px) scale(1.08); }
  66%       { transform: translate(-15px, 35px) scale(0.95); }
}

@keyframes driftB {
  0%, 100% { transform: translate(0, 0) scale(1); }
  40%       { transform: translate(-25px, 30px) scale(1.1); }
  70%       { transform: translate(20px, -10px) scale(0.92); }
}

@keyframes driftC {
  0%, 100% { transform: translate(0, 0) scale(1); }
  30%       { transform: translate(40px, -20px) scale(1.06); }
  65%       { transform: translate(-10px, 25px) scale(0.96); }
}

/* =====================
   噪点纹理
   ===================== */
.noise-mask {
  position: fixed;
  inset: 0;
  max-width: 430px;
  margin: 0 auto;
  left: 0;
  right: 0;
  z-index: 1;
  opacity: 0.04;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-size: 256px 256px;
  pointer-events: none;
}

/* =====================
   内容层
   ===================== */
.content-layer {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 18px;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

/* =====================
   品牌区域
   ===================== */
.brand-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: clamp(48px, 10vh, 80px);
  margin-bottom: 30px;
  animation: fadeSlideDown 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes fadeSlideDown {
  from { opacity: 0; transform: translateY(-16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.logo-glass {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  box-shadow:
    0 8px 32px rgba(59, 130, 246, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    inset 0 -1px 0 rgba(0, 0, 0, 0.05);
}

.logo-glow {
  position: absolute;
  inset: -12px;
  border-radius: 30px;
  background: radial-gradient(circle, rgba(99, 179, 255, 0.3) 0%, transparent 70%);
  filter: blur(8px);
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50%       { opacity: 1;   transform: scale(1.08); }
}

.logo-icon {
  font-size: 40px;
  color: #2563eb;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 2px 8px rgba(37, 99, 235, 0.3));
}

.brand-title {
  font-size: 21px;
  font-weight: 700;
  color: #1f2937;
  letter-spacing: 2px;
  text-shadow: 0 1px 4px rgba(255, 255, 255, 0.8);
}

.brand-en {
  margin-top: 5px;
  font-size: 9px;
  color: rgba(100, 116, 139, 0.8);
  letter-spacing: 3px;
}

/* =====================
   毛玻璃卡片
   ===================== */
.glass-card {
  position: relative;
  width: 100%;
  max-width: 390px;
  padding: 28px 22px 26px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  box-shadow:
    0 0 0 0.5px rgba(255, 255, 255, 0.5),
    0 24px 64px rgba(59, 130, 246, 0.08),
    0 4px 16px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  animation: fadeSlideUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
  overflow: hidden;
}

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* 卡片内部顶部高光条 */
.card-highlight {
  position: absolute;
  top: 0;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.5) 30%,
    rgba(147, 197, 253, 0.8) 50%,
    rgba(255, 255, 255, 0.5) 70%,
    transparent 100%
  );
}

/* =====================
   卡片头部
   ===================== */
.card-header {
  margin-bottom: 26px;
}

.header-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  font-size: 11px;
  color: #2563eb;
  letter-spacing: 0.5px;
}

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
  animation: blink 2s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

.card-title {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  letter-spacing: 0.5px;
}

.card-desc {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(100, 116, 139, 0.9);
}

/* =====================
   表单字段
   ===================== */
.form-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(71, 85, 105, 0.9);
  letter-spacing: 0.3px;
}

.field-label .van-icon {
  font-size: 14px;
  color: #3b82f6;
}

.field-input-wrap {
  position: relative;
}

.field-input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: none;
  outline: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(226, 232, 240, 0.8);
  font-size: 14px;
  color: #1f2937;
  transition: background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  appearance: none;
  -webkit-appearance: none;
}

.field-input::placeholder {
  color: rgba(148, 163, 184, 0.8);
  font-size: 13px;
}

.field-input:focus {
  background: rgba(255, 255, 255, 1);
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow:
    0 0 0 3px rgba(59, 130, 246, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 1);
}

/* 底部动画线 */
.field-border {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, #60a5fa, #a78bfa);
  transform: translateX(-50%);
  transition: width 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  border-radius: 0 0 12px 12px;
}

.field-input-wrap:focus-within .field-border {
  width: 80%;
}

/* =====================
   分隔线
   ===================== */
.divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 24px 0 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: rgba(203, 213, 225, 0.5);
}

.divider-text {
  font-size: 11px;
  color: rgba(148, 163, 184, 0.8);
  letter-spacing: 1px;
  white-space: nowrap;
}

/* =====================
   滑动区域
   ===================== */
.slide-area {
  margin-top: 16px;
  transition: opacity 0.2s ease;
}

.slide-area.loading {
  opacity: 0.6;
  pointer-events: none;
}

/* =====================
   页面底部
   ===================== */
.page-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 28px;
  font-size: 10px;
  color: rgba(100, 116, 139, 0.6);
  letter-spacing: 0.5px;
}

.footer-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(100, 116, 139, 0.4);
}

/* =====================
   SlideToLogin 浅色适配
   ===================== */
:deep(.slide-login-box) {
  background: rgba(255, 255, 255, 0.85) !important;
  border: 1px solid rgba(226, 232, 240, 0.8) !important;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.08) !important;
}

:deep(.slide-login-box::after) {
  background: linear-gradient(
    90deg,
    rgba(226, 232, 240, 0),
    rgba(226, 232, 240, 0.5),
    rgba(226, 232, 240, 0)
  ) !important;
}

:deep(.txt) {
  color: rgba(100, 116, 139, 0.9) !important;
  font-weight: 500 !important;
}

:deep(.txt.success) {
  color: #fff !important;
}

:deep(.bg-color) {
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%) !important;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.35) !important;
}

:deep(.slider) {
  background: linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%) !important;
  border: 1px solid rgba(203, 213, 225, 0.6) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  color: #3b82f6 !important;
}

:deep(.slider.success) {
  color: #22c55e !important;
  background: linear-gradient(145deg, rgba(34,197,94,0.1) 0%, rgba(22,163,74,0.05) 100%) !important;
  border-color: rgba(34, 197, 94, 0.3) !important;
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.2) !important;
}


</style>
