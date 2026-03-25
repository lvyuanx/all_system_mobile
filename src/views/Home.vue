<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const goToDetail = () => {
  router.push('/detail')
}

const bannerList = ref([
  { id: 1, image: 'https://fastly.jsdelivr.net/npm/@vant/assets/apple-1.jpeg' },
  { id: 2, image: 'https://fastly.jsdelivr.net/npm/@vant/assets/apple-2.jpeg' },
])

const gridList = ref([
  { id: 1, icon: 'shop-o', text: '商品' },
  { id: 2, icon: 'cart-o', text: '购物车' },
  { id: 3, icon: 'orders-o', text: '订单' },
  { id: 4, icon: 'gift-o', text: '优惠' },
])
</script>

<template>
  <div class="home-page">
    <van-swipe :autoplay="3000" indicator-color="white" class="banner-swipe">
      <van-swipe-item v-for="item in bannerList" :key="item.id">
        <img :src="item.image" alt="banner" class="banner-img" />
      </van-swipe-item>
    </van-swipe>

    <van-grid :column-num="4" :border="false" class="grid-section">
      <van-grid-item
        v-for="item in gridList"
        :key="item.id"
        :icon="item.icon"
        :text="item.text"
        icon-color="#1989fa"
      />
    </van-grid>

    <van-cell-group inset title="推荐商品" class="goods-section">
      <van-cell title="示例商品" label="点击查看详情" is-link @click="goToDetail" />
      <van-cell title="更多商品" is-link @click="goToDetail" />
    </van-cell-group>

    <div class="bottom-tip">
      <van-notice-bar
        left-icon="volume-o"
        text="欢迎来到首页，这是一个示例页面"
        background="#f7f8fa"
      />
    </div>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100%;
  background-color: var(--color-background);
}

.banner-swipe {
  height: 200px;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.grid-section {
  margin: 16px 0;
  background-color: var(--color-card);
}

.goods-section {
  margin: 0 12px 16px;
}

.bottom-tip {
  margin: 16px 12px;
}
</style>
