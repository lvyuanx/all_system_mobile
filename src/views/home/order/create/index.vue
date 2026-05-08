<script setup>
defineOptions({ name: 'OrderCreate' })

import { computed, nextTick, onActivated, onDeactivated, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { createOrder, getDeliveryList, getOrderTypeList } from '@/api/order'
import { getCurSiteOptions } from '@/api/site'
import { formatMoney } from '@/utils/orderConstants'
import { useOrderCreateStore } from '@/stores/orderCreate'

const router = useRouter()
const orderCreateStore = useOrderCreateStore()

const pageRef = ref(null)
const submitting = ref(false)
const loading = ref(false)

const siteOptions = ref([])
const orderTypeOptions = ref([])
const deliveryOptions = ref([])

const showSiteSheet = ref(false)
const showTypeSheet = ref(false)
const showDeliverySheet = ref(false)

let rafId = null
const hasLoadedOptions = ref(false)
const scrollListenerAttached = ref(false)
const dockVisible = ref(false)
const PAGE_ENTER_DELAY = 320
let dockTimer = null

const form = computed(() => orderCreateStore.draft)
const totals = computed(() => orderCreateStore.totals)
const itemTotals = computed(() => orderCreateStore.itemTotals)
const itemCount = computed(() => orderCreateStore.itemCount)
const hasShippingParty = computed(() =>
  Boolean(
    form.value.shipping_party
      || form.value.shipping_party_company
      || form.value.shipping_party_phone
      || form.value.shipping_party_address,
  ),
)
const hasReceiver = computed(() =>
  Boolean(
    form.value.receiver_name
      || form.value.receiver_company
      || form.value.receiver_phone
      || form.value.receiver_address,
  ),
)
const itemSummaryText = computed(() => `共 ${itemCount.value} 项`)

const restoreScrollPosition = async () => {
  await nextTick()
  const target = Number(form.value.scroll_top || 0)
  const el = pageRef.value
  if (!el || target <= 0) {
    return
  }
  el.scrollTop = target
}

const clearDockTimer = () => {
  if (dockTimer) {
    clearTimeout(dockTimer)
    dockTimer = null
  }
}

const scheduleDockReveal = () => {
  clearDockTimer()
  dockVisible.value = false
  dockTimer = setTimeout(() => {
    dockVisible.value = true
    dockTimer = null
  }, PAGE_ENTER_DELAY)
}

const bindScrollListener = () => {
  if (scrollListenerAttached.value) return
  pageRef.value?.addEventListener('scroll', onScroll, { passive: true })
  scrollListenerAttached.value = true
}

const unbindScrollListener = () => {
  if (!scrollListenerAttached.value) return
  pageRef.value?.removeEventListener('scroll', onScroll)
  scrollListenerAttached.value = false
}

const loadOptions = async () => {
  loading.value = true
  try {
    const [siteRes, typeRes, deliveryRes] = await Promise.all([
      getCurSiteOptions({ loading: false }),
      getOrderTypeList({ loading: false }),
      getDeliveryList({ loading: false }),
    ])
    siteOptions.value = (siteRes?.data || []).map((item) => ({
      name: item.label || item.name,
      value: item.value,
    }))
    orderTypeOptions.value = (typeRes?.data || []).map((item) => ({
      name: item.label || item.name,
      value: item.value,
    }))
    deliveryOptions.value = (deliveryRes?.data || []).map((item) => ({
      name: item.label || item.name,
      value: item.value,
    }))

    const matchedSite = siteOptions.value.find((item) => item.value === form.value.site_id)
    if (siteOptions.value.length && !matchedSite) {
      orderCreateStore.updateBaseInfo({
        site_id: siteOptions.value[0].value,
        site_name: siteOptions.value[0].name,
      }, { markDirty: false })
    }

    const matchedType = orderTypeOptions.value.find((item) => item.value === form.value.order_type)
    if (orderTypeOptions.value.length && !matchedType) {
      orderCreateStore.updateBaseInfo({
        order_type: orderTypeOptions.value[0].value,
        order_type_label: orderTypeOptions.value[0].name,
      }, { markDirty: false })
    }

    const matchedDelivery = deliveryOptions.value.find((item) => item.value === form.value.delivery_method)
    if (deliveryOptions.value.length && !matchedDelivery) {
      orderCreateStore.updateBaseInfo({
        delivery_method: deliveryOptions.value[0].value,
        delivery_method_label: deliveryOptions.value[0].name,
      }, { markDirty: false })
    }
  } catch {
    showToast('基础数据加载失败')
  } finally {
    loading.value = false
  }
}

const onScroll = () => {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    const el = pageRef.value
    if (!el) return
    orderCreateStore.setScrollTop(el.scrollTop)
  })
}

const onClickLeft = async () => {
  if (!orderCreateStore.isDirty) {
    const hasBack = Boolean(window.history.state?.back)
    if (hasBack) {
      router.back()
      return
    }
    router.replace('/home/order')
    return
  }

  try {
    await showConfirmDialog({
      title: '放弃编辑',
      message: '当前订单草稿尚未提交，确认放弃本次编辑吗？',
    })
    orderCreateStore.resetDraft()
    const hasBack = Boolean(window.history.state?.back)
    if (hasBack) {
      router.back()
      return
    }
    router.replace('/home/order')
  } catch {
    return
  }
}

const onCancel = () => {
  onClickLeft()
}

const openSiteSheet = () => {
  if (!siteOptions.value.length) return
  showSiteSheet.value = true
}

const openTypeSheet = () => {
  if (!orderTypeOptions.value.length) return
  showTypeSheet.value = true
}

const openDeliverySheet = () => {
  if (!deliveryOptions.value.length) return
  showDeliverySheet.value = true
}

const onSelectSite = (action) => {
  orderCreateStore.updateBaseInfo({
    site_id: action.value,
    site_name: action.name,
  })
  showSiteSheet.value = false
}

const onSelectType = (action) => {
  orderCreateStore.updateBaseInfo({
    order_type: action.value,
    order_type_label: action.name,
  })
  showTypeSheet.value = false
}

const onSelectDelivery = (action) => {
  orderCreateStore.updateBaseInfo({
    delivery_method: action.value,
    delivery_method_label: action.name,
  })
  showDeliverySheet.value = false
}

const goSelectPartner = (type) => {
  if (!form.value.site_id) {
    showToast('请先选择站点')
    return
  }
  router.push({
    path: '/home/order/partner-select',
    query: {
      type,
      site_id: form.value.site_id,
      name: type === 'shipping' ? '选择发货方' : '选择收货方',
    },
  })
}

const goSelectPattern = (index) => {
  router.push({
    path: '/home/order/pattern-select',
    query: {
      index,
      name: '选择款号',
    },
  })
}

const onItemFieldChange = (index, key, value) => {
  orderCreateStore.updateItem(index, { [key]: value })
}

const normalizeItemUnit = (index) => {
  const current = String(form.value.items?.[index]?.total_unit || '').trim()
  if (current) return
  orderCreateStore.updateItem(index, { total_unit: '元' })
}

const addItem = async () => {
  orderCreateStore.addItem()
  await nextTick()
  const el = document.getElementById(`order-item-${itemCount.value - 1}`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

const removeItem = (index) => {
  const removed = orderCreateStore.removeItem(index)
  if (!removed) {
    showToast('至少保留一个订单项')
  }
}

const onSubmit = async () => {
  if (submitting.value) return

  const validation = orderCreateStore.validateBeforeSubmit()
  if (!validation.valid) {
    showToast(validation.message)
    return
  }

  try {
    await showConfirmDialog({ title: '确认提交', message: '确认提交当前订单吗？' })
  } catch {
    return
  }

  submitting.value = true
  try {
    await createOrder(orderCreateStore.buildCreatePayload(), { loading: false })
    showToast('订单创建成功')
    orderCreateStore.resetDraft()
    const hasBack = Boolean(window.history.state?.back)
    if (hasBack) {
      router.back()
      return
    }
    router.replace('/home/order')
  } catch {
    // 错误由拦截器处理
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  orderCreateStore.initializeDraft()
  if (!hasLoadedOptions.value) {
    await loadOptions()
    hasLoadedOptions.value = true
  }
  await restoreScrollPosition()
  bindScrollListener()
  scheduleDockReveal()
})

onActivated(async () => {
  if (!hasLoadedOptions.value) {
    await loadOptions()
    hasLoadedOptions.value = true
  }
  await restoreScrollPosition()
  bindScrollListener()
  scheduleDockReveal()
})

onDeactivated(() => {
  orderCreateStore.setScrollTop(pageRef.value?.scrollTop || 0)
  unbindScrollListener()
  clearDockTimer()
  dockVisible.value = false
})

onUnmounted(() => {
  orderCreateStore.setScrollTop(pageRef.value?.scrollTop || 0)
  unbindScrollListener()
  clearDockTimer()
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div ref="pageRef" class="page">
    <div class="page-topbar">
      <div class="topbar-inner">
        <button class="back-btn" @click="onClickLeft">
          <van-icon name="arrow-left" size="18" />
        </button>
        <div class="topbar-title">新建订单</div>
        <div class="topbar-spacer"></div>
      </div>
    </div>

    <div v-if="loading" class="loading-wrap">
      <van-loading size="28" color="#2563eb" vertical>加载中...</van-loading>
    </div>

    <div v-else class="content">
      <div class="card summary-card">
        <div class="summary-grid">
          <div class="summary-cell" @click="openSiteSheet">
            <div class="summary-label">站点</div>
            <div :class="form.site_name ? 'summary-value' : 'summary-placeholder'">
              {{ form.site_name || '请选择站点' }}
            </div>
          </div>
          <div class="summary-cell" @click="openTypeSheet">
            <div class="summary-label">订单类型</div>
            <div :class="form.order_type_label ? 'summary-value' : 'summary-placeholder'">
              {{ form.order_type_label || '请选择类型' }}
            </div>
          </div>
          <div class="summary-cell" @click="openDeliverySheet">
            <div class="summary-label">配送方式</div>
            <div :class="form.delivery_method_label ? 'summary-value' : 'summary-placeholder'">
              {{ form.delivery_method_label || '请选择配送' }}
            </div>
          </div>
          <div class="summary-cell summary-cell--accent">
            <div class="summary-label">应付金额</div>
            <div class="summary-price">￥{{ formatMoney(totals.payable) }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <van-icon name="shop-o" class="card-icon" />
          <span class="card-title">发货方</span>
          <button class="card-action-btn" @click="goSelectPartner('shipping')">选择发货方</button>
        </div>
        <template v-if="hasShippingParty">
          <div class="partner-summary">
            <div class="partner-title">
              {{ orderCreateStore.shippingSummary || '未命名发货方' }}
            </div>
            <div class="partner-meta">{{ form.shipping_party_phone || '暂无电话' }}</div>
            <div class="partner-meta">{{ form.shipping_party_address || '暂无地址' }}</div>
          </div>
        </template>
        <template v-else>
          <div class="empty-state">
            <div class="empty-title">还没有发货方信息</div>
            <div class="empty-desc">从历史地址中选择，或在下方直接补充完整信息。</div>
          </div>
        </template>
        <div class="field-grid field-grid--single">
          <div class="field-card">
            <span class="field-label">发货方</span>
            <input
              :value="form.shipping_party"
              class="field-input"
              placeholder="请输入发货方"
              @input="orderCreateStore.updateShippingParty({ shipping_party: $event.target.value })"
            />
          </div>
          <div class="field-card">
            <span class="field-label">公司</span>
            <input
              :value="form.shipping_party_company"
              class="field-input"
              placeholder="请输入发货方公司"
              @input="orderCreateStore.updateShippingParty({ shipping_party_company: $event.target.value })"
            />
          </div>
          <div class="field-card">
            <span class="field-label">电话</span>
            <input
              :value="form.shipping_party_phone"
              class="field-input"
              placeholder="请输入发货方电话"
              @input="orderCreateStore.updateShippingParty({ shipping_party_phone: $event.target.value })"
            />
          </div>
          <div class="field-card field-card--full">
            <span class="field-label">地址</span>
            <textarea
              :value="form.shipping_party_address"
              class="field-input field-textarea"
              rows="2"
              placeholder="请输入发货方地址"
              @input="orderCreateStore.updateShippingParty({ shipping_party_address: $event.target.value })"
            />
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <van-icon name="location-o" class="card-icon" />
          <span class="card-title">收货方</span>
          <button class="card-action-btn" @click="goSelectPartner('receiver')">选择收货方</button>
        </div>
        <template v-if="hasReceiver">
          <div class="partner-summary partner-summary--receiver">
            <div class="partner-title">
              {{ orderCreateStore.receiverSummary || '未命名收货方' }}
            </div>
            <div class="partner-meta">{{ form.receiver_phone || '暂无电话' }}</div>
            <div class="partner-meta">{{ form.receiver_address || '暂无地址' }}</div>
          </div>
        </template>
        <template v-else>
          <div class="empty-state">
            <div class="empty-title">还没有收货方信息</div>
            <div class="empty-desc">可以先选历史地址，再手动补齐收件信息。</div>
          </div>
        </template>
        <div class="field-grid field-grid--single">
          <div class="field-card">
            <span class="field-label">收货人</span>
            <input
              :value="form.receiver_name"
              class="field-input"
              placeholder="请输入收货人"
              @input="orderCreateStore.updateReceiver({ receiver_name: $event.target.value })"
            />
          </div>
          <div class="field-card">
            <span class="field-label">公司</span>
            <input
              :value="form.receiver_company"
              class="field-input"
              placeholder="请输入收货公司"
              @input="orderCreateStore.updateReceiver({ receiver_company: $event.target.value })"
            />
          </div>
          <div class="field-card">
            <span class="field-label">电话</span>
            <input
              :value="form.receiver_phone"
              class="field-input"
              placeholder="请输入收货人电话"
              @input="orderCreateStore.updateReceiver({ receiver_phone: $event.target.value })"
            />
          </div>
          <div class="field-card field-card--full">
            <span class="field-label">地址</span>
            <textarea
              :value="form.receiver_address"
              class="field-input field-textarea"
              rows="2"
              placeholder="请输入收货地址"
              @input="orderCreateStore.updateReceiver({ receiver_address: $event.target.value })"
            />
          </div>
        </div>
      </div>

      <div class="section-head">
        <div class="section-head-left">
          <van-icon name="records-o" class="section-icon" />
          <span>订单项</span>
        </div>
        <div class="section-head-right">
          <span class="section-count">{{ itemSummaryText }}</span>
          <button class="ghost-btn" @click="addItem">添加订单项</button>
        </div>
      </div>

      <div
        v-for="(item, index) in form.items"
        :id="`order-item-${index}`"
        :key="index"
        class="card item-card"
      >
        <div class="item-card-top">
          <div class="item-headline">
            <span class="item-order">订单项 {{ index + 1 }}</span>
            <div class="item-code-row">
              <span class="item-code">{{ item.pattern_code || '未选择款号' }}</span>
              <span class="item-subtotal">小计 ￥{{ formatMoney(itemTotals[index]?.payable || 0) }}</span>
            </div>
          </div>
          <div class="item-top-actions">
            <button class="pill-btn pill-btn--primary" @click="goSelectPattern(index)">选择款号</button>
            <button class="pill-btn pill-btn--danger" @click="removeItem(index)">删除</button>
          </div>
        </div>

        <div v-if="item.pattern_memo || item.pattern_image" class="pattern-preview">
          <van-image
            v-if="item.pattern_image"
            :src="item.pattern_image"
            width="52"
            height="52"
            fit="cover"
            class="pattern-thumb"
          />
          <div class="pattern-preview-text">
            <div class="pattern-preview-title">{{ item.pattern_code || '已选择款号' }}</div>
            <div class="pattern-preview-memo">{{ item.pattern_memo || '可继续补充颜色、数量、单价与备注' }}</div>
          </div>
        </div>

        <div class="field-grid">
          <div class="field-card">
            <span class="field-label">颜色</span>
            <input
              :value="item.color"
              class="field-input"
              placeholder="请输入颜色"
              @input="onItemFieldChange(index, 'color', $event.target.value)"
            />
          </div>
          <div class="field-card">
            <span class="field-label">数量</span>
            <input
              :value="item.count"
              class="field-input"
              type="number"
              inputmode="numeric"
              placeholder="请输入数量"
              @input="onItemFieldChange(index, 'count', $event.target.value)"
            />
          </div>
          <div class="field-card">
            <span class="field-label">价格单位</span>
            <input
              :value="item.total_unit"
              class="field-input"
              placeholder="默认元"
              @input="onItemFieldChange(index, 'total_unit', $event.target.value)"
              @blur="normalizeItemUnit(index)"
            />
          </div>
          <div class="field-card">
            <span class="field-label">单价</span>
            <input
              :value="item.unit_price"
              class="field-input"
              type="number"
              inputmode="decimal"
              placeholder="请输入单价"
              @input="onItemFieldChange(index, 'unit_price', $event.target.value)"
            />
          </div>
          <div class="field-card">
            <span class="field-label">优惠</span>
            <input
              :value="item.discount_price"
              class="field-input"
              type="number"
              inputmode="decimal"
              placeholder="0.00"
              @input="onItemFieldChange(index, 'discount_price', $event.target.value)"
            />
          </div>
          <div class="field-card field-card--full">
            <span class="field-label">备注</span>
            <textarea
              :value="item.memo"
              class="field-input field-textarea"
              rows="2"
              placeholder="可填写订单项备注"
              @input="onItemFieldChange(index, 'memo', $event.target.value)"
            />
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <van-icon name="comment-o" class="card-icon" />
          <span class="card-title">订单备注</span>
        </div>
        <textarea
          :value="form.memo"
          class="memo-area"
          rows="3"
          placeholder="填写给内部团队或订单处理人员的备注"
          @input="orderCreateStore.updateBaseInfo({ memo: $event.target.value })"
        />
      </div>
    </div>

    <div class="submit-dock" :class="{ visible: dockVisible }">
      <div class="dock-summary">
        <div class="dock-line">
          <span>总金额</span>
          <span>￥{{ formatMoney(totals.total) }}</span>
        </div>
        <div class="dock-line">
          <span>优惠</span>
          <span>￥{{ formatMoney(totals.discount) }}</span>
        </div>
        <div class="dock-line dock-line--highlight">
          <span>应付</span>
          <span>￥{{ formatMoney(totals.payable) }}</span>
        </div>
      </div>
      <div class="dock-actions">
        <button class="dock-btn dock-btn--ghost" @click="onCancel">放弃编辑</button>
        <button class="dock-btn dock-btn--primary" :disabled="submitting" @click="onSubmit">
          {{ submitting ? '提交中...' : '提交订单' }}
        </button>
      </div>
    </div>

    <van-action-sheet
      v-model:show="showSiteSheet"
      :actions="siteOptions"
      cancel-text="取消"
      @select="onSelectSite"
    />
    <van-action-sheet
      v-model:show="showTypeSheet"
      :actions="orderTypeOptions"
      cancel-text="取消"
      @select="onSelectType"
    />
    <van-action-sheet
      v-model:show="showDeliverySheet"
      :actions="deliveryOptions"
      cancel-text="取消"
      @select="onSelectDelivery"
    />
  </div>
</template>

<style scoped>
.page {
  --c-primary: #2563eb;
  --c-primary-soft: #eff6ff;
  --c-text: #1f2a44;
  --c-sub: #475569;
  --c-muted: #94a3b8;
  --c-border: #e5e7eb;
  --c-bg: #f4f6fb;
  --c-card: #ffffff;
  --radius: 14px;
  --shadow: 0 8px 24px rgba(31, 42, 68, 0.08);
  min-height: 100vh;
  overflow-y: auto;
  background: var(--c-bg);
  padding-bottom: calc(180px + env(safe-area-inset-bottom));
}

.page-topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  padding-top: env(safe-area-inset-top);
  background: #f4f6fb;
}

.topbar-inner {
  height: 46px;
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  padding: 0 8px 0 4px;
}

.back-btn {
  border: 0;
  background: transparent;
  color: #1f2a44;
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.topbar-title {
  font-size: 17px;
  font-weight: 700;
  color: #1f2a44;
  text-align: center;
}

.loading-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 84px 0;
}

.content {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card {
  background: var(--c-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 14px 16px;
}

.summary-card {
  padding: 0;
  overflow: hidden;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.summary-cell {
  padding: 14px 16px;
  border-right: 1px solid rgba(31, 42, 68, 0.06);
  border-bottom: 1px solid rgba(31, 42, 68, 0.06);
}

.summary-cell:nth-child(2n) {
  border-right: none;
}

.summary-cell:nth-last-child(-n + 2) {
  border-bottom: none;
}

.summary-cell--accent {
  background: linear-gradient(135deg, #f8fbff, #eef5ff);
}

.summary-label {
  font-size: 12px;
  color: var(--c-muted);
}

.summary-value,
.summary-price {
  margin-top: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--c-text);
  line-height: 1.4;
}

.summary-price {
  color: var(--c-primary);
  font-size: 18px;
}

.summary-placeholder {
  margin-top: 8px;
  font-size: 14px;
  color: var(--c-muted);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.card-icon {
  font-size: 16px;
  color: var(--c-primary);
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--c-text);
}

.card-action-btn {
  margin-left: auto;
  border: none;
  background: rgba(37, 99, 235, 0.12);
  color: var(--c-primary);
  font-size: 12px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 999px;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--c-border);
  gap: 12px;
}

.form-row--last {
  border-bottom: none;
  padding-bottom: 4px;
}

.form-label {
  font-size: 14px;
  color: var(--c-sub);
  flex-shrink: 0;
}

.form-value-row {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  min-width: 0;
}

.form-value {
  font-size: 14px;
  color: var(--c-text);
  font-weight: 600;
  text-align: right;
}

.form-placeholder {
  font-size: 14px;
  color: var(--c-muted);
  text-align: right;
}

.form-arrow {
  color: var(--c-muted);
}

.partner-summary {
  background: linear-gradient(135deg, #eff6ff, #f8fbff);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 12px;
}

.partner-summary--receiver {
  background: linear-gradient(135deg, #f0fdf4, #f8fffb);
}

.partner-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--c-text);
  line-height: 1.5;
}

.partner-meta {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--c-sub);
  word-break: break-all;
}

.empty-state {
  padding: 14px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  margin-bottom: 12px;
}

.empty-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--c-text);
}

.empty-desc {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--c-sub);
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.field-grid--single {
  grid-template-columns: 1fr;
}

.field-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 12px 10px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.field-card--full {
  grid-column: 1 / -1;
}

.field-label {
  font-size: 12px;
  color: var(--c-muted);
}

.field-input {
  border: none;
  outline: none;
  background: transparent;
  padding: 0;
  font-size: 14px;
  color: var(--c-text);
  width: 100%;
}

.field-input::placeholder {
  color: #c0cad7;
}

.field-textarea {
  resize: none;
  line-height: 1.6;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 2px 4px 0;
}

.section-head-left,
.section-head-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-head-left {
  font-size: 15px;
  font-weight: 700;
  color: var(--c-text);
}

.section-icon {
  font-size: 16px;
  color: var(--c-primary);
}

.section-count {
  font-size: 12px;
  color: var(--c-muted);
}

.ghost-btn {
  border: none;
  background: rgba(37, 99, 235, 0.12);
  color: var(--c-primary);
  font-size: 12px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 999px;
}

.item-card {
  padding: 14px 14px 16px;
}

.item-card-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.item-headline {
  min-width: 0;
}

.item-order {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: #eff6ff;
  color: var(--c-primary);
  font-size: 11px;
  font-weight: 700;
}

.item-code-row {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-code {
  font-size: 16px;
  font-weight: 700;
  color: var(--c-text);
  line-height: 1.4;
  word-break: break-all;
}

.item-subtotal {
  font-size: 12px;
  color: var(--c-sub);
}

.item-top-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.pill-btn {
  border: none;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 999px;
}

.pill-btn--primary {
  background: rgba(37, 99, 235, 0.12);
  color: var(--c-primary);
}

.pill-btn--danger {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}

.pattern-preview {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 12px;
}

.pattern-thumb {
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: #eef2f7;
}

.pattern-preview-text {
  min-width: 0;
}

.pattern-preview-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--c-text);
}

.pattern-preview-memo {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--c-sub);
  word-break: break-all;
}

.memo-area {
  width: 100%;
  border: none;
  outline: none;
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px 14px;
  box-sizing: border-box;
  resize: none;
  font-size: 14px;
  line-height: 1.7;
  color: var(--c-text);
}

.memo-area::placeholder {
  color: #c0cad7;
}

.submit-dock {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 110;
  padding: 12px 12px calc(12px + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(244, 246, 251, 0), rgba(244, 246, 251, 0.92) 16%, #f4f6fb 42%);
  opacity: 0;
  transform: translate3d(0, 20px, 0);
  pointer-events: none;
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.submit-dock.visible {
  opacity: 1;
  transform: translate3d(0, 0, 0);
  pointer-events: auto;
}

.dock-summary {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 10px 30px rgba(31, 42, 68, 0.12);
  border-radius: 16px;
  padding: 12px 14px;
  display: grid;
  gap: 6px;
}

.dock-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: var(--c-sub);
}

.dock-line--highlight {
  color: var(--c-primary);
  font-size: 15px;
  font-weight: 700;
}

.dock-actions {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 10px;
  margin-top: 10px;
}

.dock-btn {
  border: none;
  border-radius: 14px;
  height: 48px;
  font-size: 15px;
  font-weight: 700;
}

.dock-btn--ghost {
  background: #fff;
  color: var(--c-sub);
  border: 1px solid rgba(203, 213, 225, 0.85);
}

.dock-btn--primary {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.24);
}

.dock-btn:disabled {
  opacity: 0.7;
}

@media (max-width: 375px) {
  .field-grid {
    grid-template-columns: 1fr;
  }

  .item-card-top {
    flex-direction: column;
  }

  .item-top-actions {
    flex-direction: row;
    justify-content: flex-start;
  }
}
</style>
