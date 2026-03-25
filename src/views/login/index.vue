<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import SlideToLogin from './components/SlideToLogin.vue'

const router = useRouter()
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

const tips = () => {
  showToast('请联系管理员重置密码')
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
    showToast('登录成功')
    router.replace('/home')
  } finally {
    loading.value = false
    resetSlider()
  }
}

</script>

<template>
  <div class="login-page">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>

    <div class="login-box">
      <div class="logo">
        <van-icon name="shield-o" />
      </div>

      <h3 class="title-box"><strong>订单管理系统</strong></h3>
      <p class="sub-title">安全登录 · 高效协同</p>

      <div class="form-area">
        <div class="input-control mb">
          <span class="left-icon"><van-icon name="contact-o" /></span>
          <input v-model="form.username" type="text" placeholder="请输入用户名" />
        </div>

        <div class="input-control mb-small">
          <span class="left-icon"><van-icon name="lock" /></span>
          <input v-model="form.password" type="password" placeholder="请输入密码" />
        </div>

        <p class="tips"><a href="javascript:void(0)" @click="tips">忘记密码？</a></p>

      </div>

      <div class="slide-wrap" :class="{ loading }">
        <SlideToLogin ref="slideLoginRef" :loading="loading" @action-login="onLogin" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  min-height: 100%;
  padding: 0 16px 28px;
  background: radial-gradient(circle at 20% 10%, #f3f8ff 0%, #edf4ff 35%, #f7faff 70%, #ffffff 100%);
  overflow: hidden;
}

.bg-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(8px);
  pointer-events: none;
}

.orb-1 {
  width: 180px;
  height: 180px;
  top: -52px;
  right: -46px;
  background: rgba(92, 162, 255, 0.24);
}

.orb-2 {
  width: 140px;
  height: 140px;
  top: 180px;
  left: -70px;
  background: rgba(145, 211, 255, 0.2);
}

.login-box {
  position: relative;
  width: 100%;
  max-width: 392px;
  margin: clamp(72px, 14vh, 128px) auto 0;
  padding: 24px 16px 22px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow: 0 16px 36px rgba(46, 97, 173, 0.16);
  backdrop-filter: blur(12px);
}

.logo {
  width: 84px;
  height: 84px;
  margin: 0 auto;
  border-radius: 24px;
  background: linear-gradient(160deg, #ffffff 0%, #e8f3ff 100%);
  color: #1989fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  box-shadow: inset 0 1px 0 #fff, 0 8px 18px rgba(25, 137, 250, 0.2);
}

.title-box {
  text-align: center;
  padding: 16px 0 4px;
  font-size: 25px;
  color: #111827;
  letter-spacing: 0.5px;
}

.sub-title {
  text-align: center;
  margin-bottom: 24px;
  font-size: 13px;
  color: #6b7280;
}

.input-control {
  position: relative;
}

.input-control input {
  width: 100%;
  border: 1px solid transparent;
  outline: none;
  font-size: 14px;
  height: 44px;
  border-radius: 22px;
  padding-left: 44px;
  background: linear-gradient(180deg, #f7f9fc 0%, #f1f5fb 100%);
  color: #1f2937;
  transition: all 0.2s ease;
}

.input-control input:focus {
  border-color: rgba(25, 137, 250, 0.32);
  box-shadow: 0 0 0 4px rgba(25, 137, 250, 0.12);
  background: #fff;
}

.left-icon {
  position: absolute;
  left: 0;
  top: 0;
  width: 42px;
  height: 44px;
  color: #1989fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.mb {
  margin-bottom: 14px;
}

.mb-small {
  margin-bottom: 8px;
}

.tips {
  text-align: right;
  font-size: 12px;
  margin-bottom: 12px;
}

.tips a {
  color: #2f8cff;
}

.slide-wrap {
  margin-top: 24px;
}

.slide-wrap.loading {
  opacity: 0.8;
}
</style>
