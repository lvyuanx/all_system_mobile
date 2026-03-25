<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 侧边栏索引
const activeKey = ref(0)

// 分类数据
const categories = ref([
  { text: '热门推荐', id: 0 },
  { text: '手机数码', id: 1 },
  { text: '家用电器', id: 2 },
  { text: '食品生鲜', id: 3 },
  { text: '美妆护肤', id: 4 },
  { text: '服饰鞋包', id: 5 },
  { text: '家居家装', id: 6 },
  { text: '运动户外', id: 7 },
])

// 子分类数据
const subCategories = ref({
  0: [
    { name: '热门商品 1', price: '¥99', desc: '热销中' },
    { name: '热门商品 2', price: '¥199', desc: '新品上市' },
    { name: '热门商品 3', price: '¥299', desc: '限时优惠' },
  ],
  1: [
    { name: 'iPhone 15', price: '¥5999', desc: '全新一代' },
    { name: '华为 Mate 60', price: '¥5499', desc: '遥遥领先' },
  ],
  2: [
    { name: '智能冰箱', price: '¥2999', desc: '大容量' },
    { name: '洗衣机', price: '¥1999', desc: '静音' },
  ],
})

// 当前子分类
const currentSubCategories = computed(() => {
  return subCategories.value[activeKey.value] || []
})

// 跳转到详情页
const goToDetail = (item) => {
  router.push('/detail')
}
</script>

<template>
  <div class="category-page">
    <van-sidebar v-model="activeKey" class="sidebar">
      <van-sidebar-item
        v-for="item in categories"
        :key="item.id"
        :title="item.text"
      />
    </van-sidebar>

    <div class="content">
      <van-pull-refresh>
        <van-card
          v-for="(item, index) in currentSubCategories"
          :key="index"
          :title="item.name"
          :desc="item.desc"
          :price="item.price"
          :thumb="`https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg`"
          @click="goToDetail(item)"
        />
      </van-pull-refresh>

      <van-empty v-if="currentSubCategories.length === 0" description="暂无商品" />
    </div>
  </div>
</template>

<style scoped>
.category-page {
  display: flex;
  min-height: 100%;
  background-color: var(--color-background);
}

.sidebar {
  flex-shrink: 0;
  width: 85px;
  background-color: var(--color-card);
}

.content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.van-card {
  margin-bottom: 12px;
  background-color: var(--color-card);
}
</style>

<script>
import { computed } from 'vue'
</script>
