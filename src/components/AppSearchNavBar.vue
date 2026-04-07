<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '搜索',
  },
  showBack: {
    type: Boolean,
    default: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'search', 'clear', 'click-left', 'click-input'])

const onInput = (event) => {
  emit('update:modelValue', event.target.value)
}

const onSearch = () => {
  emit('search')
}

const onClear = () => {
  emit('update:modelValue', '')
  emit('clear')
}

const onClickInput = () => {
  emit('click-input')
}
</script>

<template>
  <div class="app-search-nav">
    <button v-if="showBack" type="button" class="left-btn" @click="emit('click-left')">
      <van-icon name="arrow-left" size="18" />
    </button>

    <div class="search-box">
      <van-icon name="search" class="search-icon" />
      <input
        :value="props.modelValue"
        :placeholder="placeholder"
        :readonly="readonly"
        class="search-input"
        @input="onInput"
        @keyup.enter="onSearch"
        @click="onClickInput"
      />
      <button
        v-if="props.modelValue"
        type="button"
        class="clear-btn"
        @click="onClear"
      >
        <van-icon name="cross" size="12" />
      </button>
    </div>

    <div class="right-slot">
      <slot name="right" />
    </div>
  </div>
</template>

<style scoped>
.app-search-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 10px;
  padding-top: calc(10px + env(safe-area-inset-top));
  background: var(--color-background);
}

.left-btn {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #1f2937;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.search-box {
  flex: 1;
  min-width: 0;
  height: 34px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid #eceff3;
  box-shadow: none;
  display: flex;
  align-items: center;
  padding: 0 8px 0 10px;
  gap: 6px;
}

.search-icon {
  color: #9ca3af;
  font-size: 14px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  font-size: 13px;
  color: #374151;
  background: transparent;
  box-shadow: none;
}

.search-input::placeholder {
  color: #9ca3af;
}

.clear-btn {
  border: 0;
  background: transparent;
  color: #9ca3af;
  padding: 0;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.right-slot {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
</style>
