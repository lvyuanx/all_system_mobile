<script setup>
defineOptions({ name: 'ProfilePassword' })

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { changePassword } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showOld = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)
const submitting = ref(false)

const onSubmit = async () => {
  if (!oldPassword.value) {
    showToast('请输入旧密码')
    return
  }
  if (!newPassword.value) {
    showToast('请输入新密码')
    return
  }
  if (newPassword.value.length < 6) {
    showToast('新密码不能少于6位')
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    showToast('两次密码输入不一致')
    return
  }

  submitting.value = true
  try {
    await changePassword(
      { old_password: oldPassword.value, new_password: newPassword.value },
      { loading: false },
    )
    showToast('密码修改成功，请重新登录')
    userStore.logout()
    setTimeout(() => {
      router.replace('/login')
    }, 1200)
  } catch {
    // 错误由拦截器处理
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="card">
      <div class="field">
        <span class="field-label">旧密码</span>
        <div class="field-input-wrap">
          <input
            v-model="oldPassword"
            class="field-input"
            :type="showOld ? 'text' : 'password'"
            placeholder="请输入旧密码"
            autocomplete="current-password"
          />
          <button type="button" class="eye-btn" @click="showOld = !showOld">
            <van-icon :name="showOld ? 'eye-o' : 'closed-eye'" size="18" />
          </button>
        </div>
      </div>

      <div class="field">
        <span class="field-label">新密码</span>
        <div class="field-input-wrap">
          <input
            v-model="newPassword"
            class="field-input"
            :type="showNew ? 'text' : 'password'"
            placeholder="请输入新密码（至少6位）"
            autocomplete="new-password"
          />
          <button type="button" class="eye-btn" @click="showNew = !showNew">
            <van-icon :name="showNew ? 'eye-o' : 'closed-eye'" size="18" />
          </button>
        </div>
      </div>

      <div class="field field--last">
        <span class="field-label">确认密码</span>
        <div class="field-input-wrap">
          <input
            v-model="confirmPassword"
            class="field-input"
            :type="showConfirm ? 'text' : 'password'"
            placeholder="请再次输入新密码"
            autocomplete="new-password"
          />
          <button type="button" class="eye-btn" @click="showConfirm = !showConfirm">
            <van-icon :name="showConfirm ? 'eye-o' : 'closed-eye'" size="18" />
          </button>
        </div>
      </div>
    </div>

    <div class="hint">修改密码后将自动退出登录，需重新登录。</div>

    <van-button
      block
      round
      type="primary"
      :loading="submitting"
      class="submit-btn"
      @click="onSubmit"
    >
      确认修改
    </van-button>
  </div>
</template>

<style scoped>
.page {
  min-height: 100%;
  background: #f3f4f6;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.field {
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid #f3f4f6;
  min-height: 52px;
  gap: 12px;
}

.field--last {
  border-bottom: none;
}

.field-label {
  font-size: 14px;
  color: #6b7280;
  flex-shrink: 0;
  width: 64px;
}

.field-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: #111827;
  background: transparent;
  text-align: right;
  padding: 0;
}

.field-input::placeholder {
  color: #9ca3af;
  font-size: 13px;
}

.eye-btn {
  border: none;
  background: transparent;
  color: #9ca3af;
  padding: 0;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
}

.hint {
  font-size: 12px;
  color: #9ca3af;
  padding: 0 4px;
}

.submit-btn {
  height: 48px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  margin-top: 4px;
}
</style>
