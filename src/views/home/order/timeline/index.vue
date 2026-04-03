<script setup>
defineOptions({ name: 'OrderTimeline' })
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getOrderTimeline } from '@/api/order'

const route = useRoute()
const router = useRouter()

const orderId = Number(route.query.id || route.query.order_id || 0)
const loading = ref(false)
const timeline = ref([])
const activeIndex = computed(() => (timeline.value.length ? timeline.value.length - 1 : 0))

const fetchTimeline = async () => {
  if (!orderId) {
    showToast('缺少订单信息')
    router.back()
    return
  }
  loading.value = true
  try {
    const res = await getOrderTimeline(orderId, { loading: false })
    timeline.value = res?.data || []
  } catch {
    showToast('操作日志加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(fetchTimeline)
</script>

<template>
  <div class="page">
    <van-loading v-if="loading" class="page-loading" color="#2563eb" />
    <template v-else>
      <van-steps v-if="timeline.length" direction="vertical" :active="activeIndex" class="steps">
        <van-step v-for="(item, idx) in timeline" :key="idx">
          <div class="step-block">
            <div class="step-title">{{ item.item_title }}</div>
            <div class="step-desc">
              <div class="desc-row">
                {{ item.item_user || '-' }} {{ item.item_phone ? `(${item.item_phone})` : '' }}
              </div>
              <div class="desc-row">{{ item.item_time || '-' }}</div>
              <div v-if="item.item_memo" class="desc-memo">{{ item.item_memo }}</div>
            </div>
          </div>
        </van-step>
      </van-steps>
      <van-empty v-else description="暂无日志" />
    </template>
  </div>
</template>

<style scoped>
.page {
  min-height: 100%;
  padding: 16px 12px 24px;
  background: #f4f6fb;
}

.page-loading {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.steps {
  background: #fff;
  border-radius: 16px;
  padding: 16px 16px 16px 32px;
  box-shadow: 0 8px 20px rgba(31, 42, 68, 0.08);
}

.steps :deep(.van-step__circle) {
  background-color: #5b6ef5;
}

.step-block {
  display: grid;
  gap: 6px;
  max-width: 100%;
}

.step-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2a44;
  word-break: break-word;
}

.step-desc {
  font-size: 12px;
  color: rgba(31, 42, 68, 0.6);
  display: grid;
  gap: 4px;
  line-height: 1.6;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.desc-memo {
  color: rgba(31, 42, 68, 0.75);
}
</style>
