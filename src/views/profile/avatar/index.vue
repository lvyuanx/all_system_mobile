<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { updateAvatar } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const fileList = ref([])

// van-uploader afterRead 回调，拿到文件后直接上传
const onAfterRead = async (file) => {
  const rawFile = file.file
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
  if (!allowed.includes(rawFile.type)) {
    showToast('请上传 jpg/png/gif 格式图片')
    fileList.value = []
    return
  }

  const formData = new FormData()
  formData.append('avatar', rawFile)

  showLoadingToast({ message: '上传中...', forbidClick: true, duration: 0 })
  try {
    const res = await updateAvatar(formData)
    const avatarPath = res?.data || ''
    // 去掉域名，只保留路径（与登录时 stripOrigin 一致）
    const stripOrigin = (url) => {
      if (!url) return ''
      try { return new URL(url).pathname + new URL(url).search } catch { return url }
    }
    userStore.updateUserInfo({ avatar: stripOrigin(avatarPath) })
    closeToast()
    showToast('头像更新成功')
    router.back()
  } catch {
    closeToast()
    fileList.value = []
  }
}
</script>

<template>
  <div class="avatar-page">
    <div class="preview-area">
      <div class="avatar-ring">
        <van-image
          round
          width="110"
          height="110"
          :src="userStore.userInfo.avatar || '/static/images/default/user_default.png'"
          fit="cover"
          class="avatar-img"
        />
      </div>
      <p class="hint-text">当前头像</p>
    </div>

    <div class="upload-area">
      <van-uploader
        v-model="fileList"
        :max-count="1"
        :after-read="onAfterRead"
        accept="image/*"
        :preview-image="false"
      >
        <div class="upload-btn">
          <van-icon name="photograph" size="22" />
          <span>选择新头像</span>
        </div>
      </van-uploader>
    </div>

    <p class="tip">支持 jpg、png、gif 格式，建议使用正方形图片</p>
  </div>
</template>

<style scoped>
.avatar-page {
  min-height: 100%;
  background: #f2f3f7;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px 32px;
}

.preview-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  margin-bottom: 40px;
}

.avatar-ring {
  width: 116px;
  height: 116px;
  border-radius: 50%;
  padding: 3px;
  background: linear-gradient(135deg, #5b6ef5, #c084fc);
  box-shadow: 0 8px 32px rgba(91, 110, 245, 0.3);
}

.avatar-img {
  display: block;
  border-radius: 50%;
  background: #fff;
}

.hint-text {
  font-size: 13px;
  color: #999;
}

.upload-area {
  margin-bottom: 20px;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 50px;
  padding: 0 32px;
  border-radius: 14px;
  background: linear-gradient(90deg, #5b6ef5 0%, #8b5cf6 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 6px 20px rgba(91, 110, 245, 0.35);
}

.tip {
  font-size: 12px;
  color: #bbb;
  text-align: center;
}
</style>
