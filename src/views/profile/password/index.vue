<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { changePassword } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const submitting = ref(false)

const form = ref({
  old_password: '',
  new_password: '',
  confirm_password: '',
})

const onSubmit = async () => {
  if (!form.value.old_password || !form.value.new_password || !form.value.confirm_password) {
    showToast('请填写所有字段')
    return
  }
  if (form.value.new_password !== form.value.confirm_password) {
    showToast('两次输入的新密码不一致')
    return
  }
  submitting.value = true
  try {
    await changePassword({
      old_password: form.value.old_password,
      new_password: form.value.new_password,
    })
    showToast('密码修改成功，请重新登录')
    userStore.logout()
    router.replace('/login')
  } catch {
    // 错误由拦截器处理
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="password-page">
    <van-cell-group inset>
      <van-field
        v-model="form.old_password"
        label="旧密码"
        type="password"
        placeholder="请输入旧密码"
        clearable
      />
      <van-field
        v-model="form.new_password"
        label="新密码"
        type="password"
        placeholder="请输入新密码"
        clearable
      />
      <van-field
        v-model="form.confirm_password"
        label="确认密码"
        type="password"
        placeholder="请再次输入新密码"
        clearable
      />
    </van-cell-group>

    <div class="submit-area">
      <van-button block type="primary" :loading="submitting" @click="onSubmit">确认修改</van-button>
    </div>
  </div>
</template>

<style scoped>
.password-page {
  min-height: 100%;
  padding: 12px;
  background: #f7f8fa;
}

.submit-area {
  margin-top: 24px;
  padding: 0 4px;
}
</style>
