<script setup>
const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  showBack: {
    type: Boolean,
    default: true,
  },
  background: {
    type: String,
    default: 'var(--color-background)',
  },
})

const emit = defineEmits(['click-left'])
</script>

<template>
  <div class="app-custom-navbar" :style="{ background: props.background }">
    <div class="bar">
      <button
        v-if="props.showBack"
        type="button"
        class="left-btn"
        @click="emit('click-left')"
      >
        <van-icon name="arrow-left" size="20" />
      </button>
      <div v-else class="left-placeholder"></div>

      <div class="title text-ellipsis">{{ props.title || '页面' }}</div>

      <div class="right-slot">
        <slot name="right" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-custom-navbar {
  padding-top: env(safe-area-inset-top);
}

.bar {
  height: 46px;
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
}

.left-btn {
  border: 0;
  background: transparent;
  color: #1f2937;
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.left-placeholder {
  width: 44px;
  height: 46px;
}

.title {
  font-size: 17px;
  font-weight: 600;
  color: #111827;
  text-align: center;
}

.right-slot {
  width: 44px;
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

