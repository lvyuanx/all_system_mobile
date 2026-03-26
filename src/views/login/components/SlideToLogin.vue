<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['actionLogin'])

const boxRef = ref(null)
const bgRef = ref(null)
const sliderRef = ref(null)

const isSuccess = ref(false)
const isDragging = ref(false)
const canDrag = ref(false)
const startX = ref(0)
const startOffsetX = ref(0)
const nowX = ref(0)
const offsetX = ref(0)
const successMoveDistance = ref(0)
const EDGE_GESTURE_WIDTH = 24

const text = computed(() => {
  if (props.loading) return '登录中...'
  if (isSuccess.value) return '验证通过'
  if (isDragging.value) return '继续滑动完成登录'
  return '滑动登录'
})

const progress = computed(() => {
  if (successMoveDistance.value <= 0) return 0
  return Math.min(1, Math.max(0, offsetX.value / successMoveDistance.value))
})

const sliderStyle = computed(() => {
  const p = progress.value
  const scale = 1 + p * 0.06 + (isDragging.value ? 0.02 : 0)
  const from = `rgb(${255 - Math.round(18 * p)}, ${255 - Math.round(10 * p)}, 255)`
  const to = `rgb(${243 - Math.round(74 * p)}, ${248 - Math.round(44 * p)}, 255)`
  const shadow = `0 ${Math.round(4 + p * 6)}px ${Math.round(14 + p * 10)}px rgba(25, 137, 250, ${(0.28 + p * 0.18).toFixed(2)})`

  return {
    '--btn-scale': scale.toFixed(3),
    '--btn-from': from,
    '--btn-to': to,
    '--btn-shadow': shadow,
  }
})

const sliderClass = computed(() => ({
  success: isSuccess.value,
  dragging: isDragging.value,
  'is-advanced': progress.value > 0.66 && !isSuccess.value,
}))

const getOffsetX = (offset, min, max) => {
  if (offset < min) return min
  if (offset > max) return max
  return offset
}

const updateDistance = () => {
  if (!boxRef.value || !sliderRef.value) return
  successMoveDistance.value = Math.max(0, boxRef.value.offsetWidth - sliderRef.value.offsetWidth)
}

const applyStyle = (withTransition) => {
  const bg = bgRef.value
  const slider = sliderRef.value
  if (!bg || !slider) return

  bg.style.transition = withTransition ? 'width 0.36s cubic-bezier(0.22, 1, 0.36, 1)' : 'width 0s linear'
  slider.style.transition = withTransition
    ? 'left 0.36s cubic-bezier(0.22, 1, 0.36, 1)'
    : 'left 0s linear'

  bg.style.width = `${offsetX.value + slider.offsetWidth / 2 + 5}px`
  slider.style.left = `${offsetX.value - 5}px`
}

const reset = () => {
  isSuccess.value = false
  isDragging.value = false
  canDrag.value = false
  offsetX.value = 0
  applyStyle(true)
}

const success = () => {
  isSuccess.value = true
  isDragging.value = false
  offsetX.value = successMoveDistance.value
  applyStyle(true)
  emit('actionLogin')
}

const touchstart = (e) => {
  if (props.loading || isSuccess.value) return

  const startClientX = e.targetTouches[0].clientX
  if (startClientX <= EDGE_GESTURE_WIDTH) {
    canDrag.value = false
    isDragging.value = false
    return
  }

  canDrag.value = true
  isDragging.value = true
  startX.value = startClientX
  startOffsetX.value = offsetX.value
}

const touchmove = (e) => {
  if (props.loading || isSuccess.value || !canDrag.value) return
  e.preventDefault()
  nowX.value = e.targetTouches[0].clientX
  offsetX.value = getOffsetX(startOffsetX.value + (nowX.value - startX.value), 0, successMoveDistance.value)
  applyStyle(false)
}

const touchend = () => {
  if (props.loading || isSuccess.value || !canDrag.value) return
  canDrag.value = false
  if (offsetX.value >= successMoveDistance.value - 1) {
    success()
  } else {
    reset()
  }
}

onMounted(() => {
  updateDistance()
  reset()
  window.addEventListener('resize', updateDistance)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDistance)
})

defineExpose({
  reset,
})
</script>

<template>
  <div ref="boxRef" class="slide-login-box" :class="{ dragging: isDragging }">
    <div ref="bgRef" class="bg-color"></div>
    <div class="txt" :class="{ success: isSuccess, dragging: isDragging }">{{ text }}</div>
    <div
      ref="sliderRef"
      class="slider"
      :class="sliderClass"
      :style="sliderStyle"
      @touchstart="touchstart"
      @touchmove="touchmove"
      @touchend="touchend"
    >
      <van-icon v-if="!isSuccess" class="slider-icon" name="arrow" />
      <van-icon v-else class="slider-icon success-icon" name="success" />
    </div>
  </div>
</template>

<style scoped>
.slide-login-box {
  position: relative;
  width: 100%;
  height: 60px;
  border-radius: 30px;
  background: linear-gradient(180deg, #eff6ff 0%, #e4f1ff 100%);
  overflow: visible;
  touch-action: pan-y;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.slide-login-box::after {
  content: '';
  position: absolute;
  top: 2px;
  left: -35%;
  width: 35%;
  height: 56px;
  border-radius: 28px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0));
  animation: shimmer 2.4s ease-in-out infinite;
  pointer-events: none;
}

.bg-color {
  position: absolute;
  left: 0;
  top: 0;
  width: 40px;
  height: 60px;
  border-radius: 30px;
  background: linear-gradient(90deg, #46a8ff 0%, #1989fa 100%);
  box-shadow: 0 8px 16px rgba(25, 137, 250, 0.3);
}

.txt {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #1c8de8;
  font-weight: 600;
  letter-spacing: 0.3px;
  pointer-events: none;
  transition: color 0.2s ease, transform 0.2s ease;
}

.txt.dragging {
  transform: scale(1.01);
}

.txt.success {
  color: #fff;
}

.slider {
  position: absolute;
  left: -5px;
  top: -5px;
  width: 70px;
  height: 70px;
  border-radius: 35px;
  background: linear-gradient(180deg, var(--btn-from, #ffffff) 0%, var(--btn-to, #f3f8ff) 100%);
  box-shadow: var(--btn-shadow, 0 4px 14px rgba(25, 137, 250, 0.28));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1989fa;
  font-size: 26px;
  transform: scale(var(--btn-scale, 1));
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.slider.dragging {
  transform: scale(calc(var(--btn-scale, 1) + 0.01));
}

.slider.success {
  color: #22c55e;
  background: linear-gradient(180deg, #f3fff8 0%, #e7fbea 100%);
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.35);
}

.slider.is-advanced {
  color: #0f7fe9;
}

.slider-icon {
  transition: opacity 0.2s ease;
}

.success-icon {
  color: #16a34a;
  transform: scale(1.08);
}

@keyframes shimmer {
  0% {
    left: -35%;
    opacity: 0;
  }
  25% {
    opacity: 0.7;
  }
  100% {
    left: 120%;
    opacity: 0;
  }
}

</style>
