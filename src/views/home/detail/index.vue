<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const product = ref({
  id: 1,
  title: '示例商品详情',
  price: '199.00',
  originalPrice: '299.00',
  image: 'https://fastly.jsdelivr.net/npm/@vant/assets/apple-1.jpeg',
  desc: '这是一款优质商品，采用优质材料制作，做工精细，性价比高。',
  stock: 100,
  sales: 1000,
})

const showSku = ref(false)

const onAddCart = () => {
  vant.showToast('已加入购物车')
}

const onBuyNow = () => {
  vant.showToast('跳转结算页面')
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
            <span class="current-price">¥{{ product.price }}</span>
            <span class="original-price">¥{{ product.originalPrice }}</span>
          </div>
          <div class="sales-info">已售 {{ product.sales }} 件 · 库存 {{ product.stock }}</div>
        </template>
      </van-cell>

      <van-cell title="商品详情" :label="product.desc" :border="false" />
    </van-cell-group>

    <van-cell-group inset class="specs-section">
      <van-cell title="规格" is-link @click="showSku = true" />
    </van-cell-group>

    <van-cell-group inset class="comment-section">
      <van-cell title="用户评价" value="查看全部" is-link />
      <van-cell :border="false">
        <template #title>
          <div class="comment-item">
            <van-image
              round
              width="32"
              height="32"
              src="https://fastly.jsdelivr.net/npm/@vant/assets/user.jpeg"
            />
            <div class="comment-content">
              <div class="comment-user">用户A</div>
              <div class="comment-text">商品质量很好，推荐购买！</div>
            </div>
          </div>
        </template>
      </van-cell>
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
.comment-section {
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

.comment-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.comment-content {
  flex: 1;
}

.comment-user {
  font-size: 14px;
  color: var(--color-text);
  margin-bottom: 4px;
}

.comment-text {
  font-size: 14px;
  color: var(--color-text-light);
  line-height: 1.5;
}
</style>
