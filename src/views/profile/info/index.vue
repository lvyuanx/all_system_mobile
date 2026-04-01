<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { getProfile, updateProfile } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const submitting = ref(false)

const form = ref({
  username: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  sex: '',
  age: '',
})

const sexOptions = [
  { text: '未设置', value: '' },
  { text: '男', value: 'M' },
  { text: '女', value: 'F' },
]

onMounted(async () => {
  loading.value = true
  try {
    const res = await getProfile({ loading: false })
    const d = res?.data || {}
    form.value = {
      username: d.username || '',
      first_name: d.first_name || '',
      last_name: d.last_name || '',
      email: d.email || '',
      phone: d.phone || '',
      sex: d.sex || '',
      age: d.age != null ? String(d.age) : '',
    }
  } catch {
    showToast('获取个人信息失败')
  } finally {
    loading.value = false
  }
})

const onSubmit = async () => {
  await showConfirmDialog({ title: '提示', message: '保存后将退出登录，需重新登录' })
  submitting.value = true
  try {
    const payload = {
      username: form.value.username || undefined,
      first_name: form.value.first_name || undefined,
      last_name: form.value.last_name || undefined,
      email: form.value.email || undefined,
      phone: form.value.phone || undefined,
      sex: form.value.sex || undefined,
      age: form.value.age ? Number(form.value.age) : undefined,
    }
    await updateProfile(payload)
    showToast('修改成功，请重新登录')
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
  <div class="info-page">
    <van-loading v-if="loading" class="page-loading" color="#2563eb" />
    <template v-else>
      <van-cell-group inset>
        <van-field v-model="form.username" label="用户名" placeholder="请输入用户名" clearable />
        <van-field v-model="form.last_name" label="姓" placeholder="请输入姓" clearable />
        <van-field v-model="form.first_name" label="名" placeholder="请输入名" clearable />
        <van-field v-model="form.phone" label="手机号" placeholder="请输入手机号" clearable type="tel" />
        <van-field v-model="form.email" label="邮箱" placeholder="请输入邮箱" clearable type="email" />
        <van-field label="性别">
          <template #input>
            <van-radio-group v-model="form.sex" direction="horizontal">
              <van-radio v-for="opt in sexOptions" :key="opt.value" :name="opt.value">
                {{ opt.text }}
              </van-radio>
            </van-radio-group>
          </template>
        </van-field>
        <van-field v-model="form.age" label="年龄" placeholder="请输入年龄" clearable type="digit" />
      </van-cell-group>

      <div class="submit-area">
        <van-button block type="primary" :loading="submitting" @click="onSubmit">保存</van-button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.info-page {
  min-height: 100%;
  padding: 12px;
  background: #f7f8fa;
}

.page-loading {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.submit-area {
  margin-top: 24px;
  padding: 0 4px;
}
</style>
