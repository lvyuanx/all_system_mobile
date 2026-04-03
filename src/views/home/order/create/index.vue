<script setup>
defineOptions({ name: 'OrderCreate' })
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { createOrder, getDeliveryList, getOrderTypeList } from '@/api/order'
import { getCurSiteOptions } from '@/api/site'
import { formatMoney, toNumber } from '@/utils/orderConstants'

const router = useRouter()

const submitting = ref(false)
const DRAFT_KEY = 'order_create_draft'
const siteOptions = ref([])
const orderTypeOptions = ref([])
const deliveryOptions = ref([])

const showSiteSheet = ref(false)
const showTypeSheet = ref(false)
const showDeliverySheet = ref(false)

const form = ref({
  site_id: null,
  site_name: '',
  order_type: null,
  order_type_label: '',
  delivery_method: null,
  delivery_method_label: '',
  shipping_party: '',
  shipping_party_company: '',
  shipping_party_phone: '',
  shipping_party_address: '',
  receiver_name: '',
  receiver_company: '',
  receiver_phone: '',
  receiver_address: '',
  memo: '',
  items: [
    {
      pattern_code: '',
      color: '',
      count: 1,
      unit_price: '',
      discount_price: '0',
      total_unit: '',
      memo: '',
    },
  ],
})

const totals = computed(() => {
  let total = 0
  let discount = 0
  form.value.items.forEach((item) => {
    const count = toNumber(item.count)
    const unit = toNumber(item.unit_price)
    const discountVal = toNumber(item.discount_price)
    total += count * unit
    discount += discountVal
  })
  return {
    total,
    discount,
    payable: total - discount,
  }
})

const loadOptions = async () => {
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

    if (!form.value.site_id && siteOptions.value.length === 1) {
      form.value.site_id = siteOptions.value[0].value
      form.value.site_name = siteOptions.value[0].name
    }
    if (!form.value.order_type && orderTypeOptions.value.length === 1) {
      form.value.order_type = orderTypeOptions.value[0].value
      form.value.order_type_label = orderTypeOptions.value[0].name
    }
    if (!form.value.delivery_method && deliveryOptions.value.length === 1) {
      form.value.delivery_method = deliveryOptions.value[0].value
      form.value.delivery_method_label = deliveryOptions.value[0].name
    }
  } catch {
    showToast('基础数据加载失败')
  }
}

const saveDraft = () => {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form.value))
  } catch {}
}

const loadDraft = () => {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return
    const data = JSON.parse(raw)
    if (data && typeof data === 'object') {
      form.value = {
        ...form.value,
        ...data,
        items: Array.isArray(data.items) && data.items.length ? data.items : form.value.items,
      }
    }
  } catch {}
}

const clearDraft = () => {
  try {
    sessionStorage.removeItem(DRAFT_KEY)
  } catch {}
}

const addItem = () => {
  form.value.items.push({
    pattern_code: '',
    color: '',
    count: 1,
    unit_price: '',
    discount_price: '0',
    total_unit: '',
    memo: '',
  })
}

const removeItem = (index) => {
  if (form.value.items.length <= 1) {
    showToast('至少保留一个订单项')
    return
  }
  form.value.items.splice(index, 1)
}

const goSelectPartner = (type) => {
  const siteId = form.value.site_id || ''
  if (!siteId) {
    showToast('请先选择站点')
    return
  }
  saveDraft()
  router.push({
    path: '/home/order/partner-select',
    query: {
      type,
      site_id: siteId,
      name: type === 'shipping' ? '选择发货方' : '选择收货方',
    },
  })
}

const goSelectPattern = (index) => {
  saveDraft()
  router.push({
    path: '/home/order/pattern-select',
    query: {
      index,
      name: '选择款号',
    },
  })
}

const onSubmit = async () => {
  if (submitting.value) return
  if (!form.value.site_id) {
    showToast('请选择站点')
    return
  }
  if (!form.value.order_type) {
    showToast('请选择订单类型')
    return
  }
  if (!form.value.delivery_method) {
    showToast('请选择配送方式')
    return
  }
  if (!form.value.shipping_party.trim()) {
    showToast('请输入发货方')
    return
  }
  if (!form.value.shipping_party_phone.trim()) {
    showToast('请输入发货方电话')
    return
  }
  if (!form.value.shipping_party_address.trim()) {
    showToast('请输入发货方地址')
    return
  }
  if (!form.value.receiver_name.trim()) {
    showToast('请输入收货人')
    return
  }
  if (!form.value.receiver_phone.trim()) {
    showToast('请输入收货人电话')
    return
  }
  if (!form.value.receiver_address.trim()) {
    showToast('请输入收货地址')
    return
  }

  const itemsPayload = []
  for (const item of form.value.items) {
    if (!item.pattern_code.trim()) {
      showToast('请填写款号')
      return
    }
    if (!item.color.trim()) {
      showToast('请填写颜色')
      return
    }
    const count = toNumber(item.count)
    if (count <= 0) {
      showToast('数量必须大于0')
      return
    }
    const unitPrice = toNumber(item.unit_price)
    if (unitPrice <= 0) {
      showToast('单价必须大于0')
      return
    }
    if (!item.total_unit.trim()) {
      showToast('请填写单位')
      return
    }

    itemsPayload.push({
      pattern_code: item.pattern_code.trim(),
      color: item.color.trim(),
      count,
      unit_price: unitPrice,
      discount_price: toNumber(item.discount_price),
      total_unit: item.total_unit.trim(),
      memo: item.memo || '',
    })
  }

  try {
    await showConfirmDialog({ title: '提示', message: '确认提交订单？' })
  } catch {
    return
  }

  submitting.value = true
  try {
    await createOrder(
      {
        site_id: form.value.site_id,
        order_type: form.value.order_type,
        shipping_party: form.value.shipping_party.trim(),
        shipping_party_company: form.value.shipping_party_company.trim(),
        shipping_party_phone: form.value.shipping_party_phone.trim(),
        shipping_party_address: form.value.shipping_party_address.trim(),
        delivery_method: form.value.delivery_method,
        receiver_name: form.value.receiver_name.trim(),
        receiver_phone: form.value.receiver_phone.trim(),
        receiver_address: form.value.receiver_address.trim(),
        receiver_company: form.value.receiver_company.trim(),
        memo: form.value.memo || '',
        items: itemsPayload,
      },
      { loading: false },
    )
    showToast('订单创建成功')
    clearDraft()
    router.back()
  } catch {
    // 错误由拦截器处理
  } finally {
    submitting.value = false
  }
}

const onCancel = async () => {
  try {
    await showConfirmDialog({ title: '提示', message: '确认放弃当前编辑？' })
    clearDraft()
    router.back()
  } catch {}
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
  form.value.site_id = action.value
  form.value.site_name = action.name
  showSiteSheet.value = false
}

const onSelectType = (action) => {
  form.value.order_type = action.value
  form.value.order_type_label = action.name
  showTypeSheet.value = false
}

const onSelectDelivery = (action) => {
  form.value.delivery_method = action.value
  form.value.delivery_method_label = action.name
  showDeliverySheet.value = false
}

onMounted(async () => {
  loadDraft()
  await loadOptions()
})
</script>

<template>
  <div class="page">
    <div class="info-card">
      <div class="info-header">
        <div class="code-text">新建订单</div>
        <div class="action-row">
          <button class="btn-cancel" @click="onCancel">取消</button>
          <button class="btn-save" :disabled="submitting" @click="onSubmit">
            {{ submitting ? '提交中...' : '提交' }}
          </button>
        </div>
      </div>

      <van-cell-group class="edit-group">
        <van-cell title="站点" :value="form.site_name || '请选择'" is-link @click="openSiteSheet" />
        <van-cell title="订单类型" :value="form.order_type_label || '请选择'" is-link @click="openTypeSheet" />
        <van-cell title="配送方式" :value="form.delivery_method_label || '请选择'" is-link @click="openDeliverySheet" />
      </van-cell-group>

      <div class="section-title">
        发货方信息
        <button class="pick-btn" @click="goSelectPartner('shipping')">选择发货方</button>
      </div>
      <van-cell-group class="edit-group">
        <van-field v-model="form.shipping_party" label="发货方" placeholder="请输入发货方" />
        <van-field v-model="form.shipping_party_company" label="公司" placeholder="请输入发货方公司" />
        <van-field v-model="form.shipping_party_phone" label="电话" placeholder="请输入电话" />
        <van-field v-model="form.shipping_party_address" label="地址" placeholder="请输入地址" />
      </van-cell-group>

      <div class="section-title">
        收货信息
        <button class="pick-btn" @click="goSelectPartner('receiver')">选择收货方</button>
      </div>
      <van-cell-group class="edit-group">
        <van-field v-model="form.receiver_name" label="收货人" placeholder="请输入收货人" />
        <van-field v-model="form.receiver_company" label="公司" placeholder="请输入收货公司" />
        <van-field v-model="form.receiver_phone" label="电话" placeholder="请输入电话" />
        <van-field v-model="form.receiver_address" label="地址" placeholder="请输入收货地址" />
      </van-cell-group>

      <div class="section-title">订单备注</div>
      <van-cell-group class="edit-group">
        <van-field v-model="form.memo" label="备注" placeholder="请输入备注" />
      </van-cell-group>
    </div>

    <div class="section">
      <div class="section-head">
        <span>订单项</span>
        <button class="add-btn" @click="addItem">添加订单项</button>
      </div>
      <div v-for="(item, index) in form.items" :key="index" class="item-card">
        <div class="item-header">
          <span>订单项 {{ index + 1 }}</span>
          <div class="item-actions">
            <button class="pick-pattern-btn" @click="goSelectPattern(index)">选择款号</button>
            <button class="remove-btn" @click="removeItem(index)">删除</button>
          </div>
        </div>
        <van-cell-group inset>
          <van-field v-model="item.pattern_code" label="款号" placeholder="请输入款号" />
          <van-field v-model="item.color" label="颜色" placeholder="请输入颜色" />
          <van-field v-model="item.count" label="数量" type="number" placeholder="请输入数量" />
          <van-field v-model="item.total_unit" label="单位" placeholder="例如 件" />
          <van-field v-model="item.unit_price" label="单价" type="number" inputmode="decimal" placeholder="请输入单价" />
          <van-field v-model="item.discount_price" label="优惠" type="number" inputmode="decimal" placeholder="请输入优惠金额" />
          <van-field v-model="item.memo" label="备注" placeholder="可填写备注" />
        </van-cell-group>
      </div>
    </div>

    <div class="summary-card">
      <div class="summary-row">
        <span>总金额</span>
        <span>￥{{ formatMoney(totals.total) }}</span>
      </div>
      <div class="summary-row">
        <span>优惠</span>
        <span>￥{{ formatMoney(totals.discount) }}</span>
      </div>
      <div class="summary-row highlight">
        <span>应付</span>
        <span>￥{{ formatMoney(totals.payable) }}</span>
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
  min-height: 100%;
  background: #f2f3f7;
  padding-bottom: 40px;
}

.info-card {
  margin: 14px;
  background: #fff;
  border-radius: 16px;
  padding: 18px 16px 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.code-text {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: 0.5px;
}

.action-row {
  display: flex;
  gap: 8px;
}

.btn-cancel,
.btn-save {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
}

.btn-cancel {
  background: #f5f5f5;
  color: #888;
}

.btn-save {
  background: linear-gradient(90deg, #5b6ef5, #8b5cf6);
  color: #fff;
}

.btn-save:disabled {
  opacity: 0.6;
}

.section-title {
  margin: 12px 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: #888;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pick-btn {
  border: none;
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  cursor: pointer;
  flex-shrink: 0;
}

.edit-group {
  margin: 0 -16px;
}

.section {
  margin: 12px 14px 0;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 700;
  color: #1f2a44;
}

.add-btn {
  border: none;
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 999px;
  cursor: pointer;
}

.item-card {
  margin-bottom: 12px;
  background: #fff;
  border-radius: 14px;
  padding: 10px 12px 12px;
  box-shadow: 0 4px 16px rgba(31, 42, 68, 0.06);
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 700;
  color: #1f2a44;
  margin-bottom: 6px;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pick-pattern-btn {
  border: none;
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  cursor: pointer;
}

.remove-btn {
  border: none;
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  cursor: pointer;
}

.summary-card {
  margin: 16px 14px 0;
  background: #fff;
  border-radius: 16px;
  padding: 12px 14px;
  box-shadow: 0 4px 18px rgba(31, 42, 68, 0.08);
  display: grid;
  gap: 6px;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #1f2a44;
}

.summary-row.highlight {
  font-weight: 700;
  color: #2563eb;
}
</style>
