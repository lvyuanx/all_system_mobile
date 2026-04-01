<script setup>
import { ref } from 'vue'
import { showConfirmDialog, showLoadingToast, closeToast, showToast } from 'vant'

const clearing = ref(false)

const onClearCache = async () => {
  if (clearing.value) return
  try {
    await showConfirmDialog({
      title: '确认清理',
      message: '确定要清理缓存吗？',
    })
  } catch {
    return
  }
  clearing.value = true
  showLoadingToast({ message: '清理中...', forbidClick: true, duration: 0 })
  setTimeout(() => {
    closeToast()
    showToast('缓存已清理')
    clearing.value = false
  }, 1200)
}
</script>

<template>
  <div class="settings-page">
    <div class="settings-card">
      <div class="card-title">系统设置</div>
      <div class="card-desc">仅提供基础维护功能。</div>
      <van-cell
        title="清理缓存"
        :value="clearing ? '清理中...' : '释放空间'"
        is-link
        @click="onClearCache"
      />
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  min-height: 100%;
  padding: 16px;
  background: #f5f6fb;
}

.settings-card {
  background: #fff;
  border-radius: 16px;
  padding: 14px 12px 8px;
  box-shadow: 0 8px 24px rgba(31, 42, 68, 0.08);
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: #1f2a44;
  margin-bottom: 4px;
}

.card-desc {
  font-size: 12px;
  color: rgba(31, 42, 68, 0.6);
  margin-bottom: 10px;
}
</style>
