<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'

const route = useRoute()

const product = ref({
  id: 1,
  title: '示例商品详情',
  price: '199.00',
  originalPrice: '299.00',
  image: 'https://fastly.jsdelivr.net/npm/@vant/assets/apple-1.jpeg',
  desc: '这是一款优质商品，采用高品质材料制作，做工精细，性价比高。',
  stock: 100,
  sales: 1000,
})

const showSku = ref(false)

const operationLogs = ref([
  {
    title: '创建订单',
    time: '2026-04-03 01:25:37',
    operator: '系统',
    desc: '订单已创建，等待支付。',
  },
  {
    title: '支付确认',
    time: '2026-04-03 01:30:12',
    operator: '财务',
    desc: '支付状态更新为待审核。',
  },
  {
    title: '审核通过',
    time: '2026-04-03 01:36:40',
    operator: '管理员',
    desc: '订单进入生产流程。',
  },
])

const activeLogIndex = computed(() =>
  operationLogs.value.length ? operationLogs.value.length - 1 : 0,
)

const onAddCart = () => {
  showToast('已加入购物车')
}

const onBuyNow = () => {
  showToast('跳转结算页面')
}

onMounted(() => {
  const id = route.query.id
  if (id) {
    console.log('商品ID:', id)
  }
})
</script>

<template>
  <div class="detail-page">
    <van-swipe :autoplay="3000" indicator-color="white">
      <van-swipe-item>
        <img :src="product.image" alt="商品图片" class="product-image" />
      </van-swipe-item>
    </van-swipe>

    <van-cell-group inset class="product-info">
      <van-cell :title="product.title" :border="false">
        <template #label>
          <div class="price-section">
            <span class="current-price">￥{{ product.price }}</span>
            <span class="original-price">￥{{ product.originalPrice }}</span>
          </div>
          <div class="sales-info">已售 {{ product.sales }} 件 · 库存 {{ product.stock }}</div>
        </template>
      </van-cell>

      <van-cell title="商品详情" :label="product.desc" :border="false" />
    </van-cell-group>

    <van-cell-group inset class="specs-section">
      <van-cell title="规格" is-link @click="showSku = true" />
    </van-cell-group>

    <van-cell-group inset class="log-section">
      <div class="log-title">操作日志</div>
      <van-steps direction="vertical" :active="activeLogIndex" class="steps">
        <van-step v-for="(item, idx) in operationLogs" :key="idx">
          <div class="step-title">{{ item.title }}</div>
          <div class="step-meta">{{ item.operator }} · {{ item.time }}</div>
          <div class="step-desc">{{ item.desc }}</div>
        </van-step>
      </van-steps>
    </van-cell-group>

    <van-action-bar>
      <van-action-bar-icon icon="chat-o" text="客服" />
      <van-action-bar-icon icon="cart-o" text="购物车" />
      <van-action-bar-icon icon="shop-o" text="店铺" />
      <van-action-bar-button type="warning" text="加入购物车" @click="onAddCart" />
      <van-action-bar-button type="danger" text="立即购买" @click="onBuyNow" />
    </van-action-bar>
  </div>
</template>

<style scoped>
.detail-page {
  min-height: 100%;
  padding-bottom: 80px;
  background-color: var(--color-background);
}

.product-image {
  width: 100%;
  height: 375px;
  object-fit: cover;
}

.product-info,
.specs-section,
.log-section {
  margin: 12px;
  background-color: var(--color-card);
}

.price-section {
  margin-bottom: 4px;
}

.current-price {
  font-size: 24px;
  color: var(--color-danger);
  font-weight: 500;
}

.original-price {
  margin-left: 8px;
  font-size: 14px;
  color: var(--color-text-light);
  text-decoration: line-through;
}

.sales-info {
  font-size: 12px;
  color: var(--color-text-light);
}

.log-title {
  padding: 12px 16px 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}

.steps {
  padding: 8px 14px 14px;
}

.steps :deep(.van-step__title) {
  color: var(--color-text);
}

.steps :deep(.van-step__circle) {
  width: 8px;
  height: 8px;
}

.step-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.step-meta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-light);
}

.step-desc {
  margin-top: 4px;
  font-size: 14px;
  color: var(--color-text-light);
  line-height: 1.5;
}
</style>
