<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.replace('/home')
}
</script>

<template>
  <div class="not-found">
    <div class="code">404</div>
    <div class="title">页面不存在</div>
    <div class="desc">你访问的页面可能已删除或地址错误</div>
    <van-button type="primary" round @click="goHome">返回首页</van-button>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  background: linear-gradient(180deg, #f7f9fc 0%, #eef3f9 100%);
}

.code {
  font-size: 56px;
  font-weight: 700;
  line-height: 1;
  color: #0f172a;
}

.title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.desc {
  font-size: 14px;
  color: #64748b;
}
</style>
