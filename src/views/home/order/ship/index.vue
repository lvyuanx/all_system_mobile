<script setup>
defineOptions({ name: 'OrderShip' })
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { getDeliveryList, getOrderInfo, shipOrder } from '@/api/order'
import { formatMoney, toNumber } from '@/utils/orderConstants'

const route = useRoute()
const router = useRouter()
const orderId = Number(route.query.id || route.query.order_id || 0)

const detail = ref(null)
const loading = ref(false)
const submitting = ref(false)

const deliveryOptions = ref([])
const showDeliverySheet = ref(false)

const form = ref({
  delivery_method: null,
  delivery_method_label: '',
  tracking_no: '',
  shipping_fee: '',
})

const fetchData = async () => {
  if (!orderId) {
    showToast('缺少订单信息')
    router.back()
    return
  }
  loading.value = true
  try {
    const [orderRes, deliveryRes] = await Promise.all([
      getOrderInfo(orderId, { loading: false }),
      getDeliveryList({ loading: false }),
    ])
    detail.value = orderRes?.data || null
    const options = deliveryRes?.data || []
    deliveryOptions.value = options.map((item) => ({
      name: item.label || item.name,
      value: item.value,
    }))

    if (detail.value?.delivery_method) {
      const matched = deliveryOptions.value.find((opt) => opt.value === detail.value.delivery_method)
      form.value.delivery_method = detail.value.delivery_method
      form.value.delivery_method_label = matched?.name || detail.value.delivery_method_str || ''
    }
    form.value.tracking_no = detail.value?.tracking_no || ''
    form.value.shipping_fee = detail.value?.shipping_fee ? String(detail.value.shipping_fee) : ''
  } catch {
    showToast('发货信息加载失败')
  } finally {
    loading.value = false
  }
}

const openDeliverySheet = () => {
  if (!deliveryOptions.value.length) return
  showDeliverySheet.value = true
}

const onSelectDelivery = (action) => {
  form.value.delivery_method = action.value
  form.value.delivery_method_label = action.name
  showDeliverySheet.value = false
}

const onSubmit = async () => {
  if (submitting.value) return
  if (!form.value.delivery_method) {
    showToast('请选择配送方式')
    return
  }
  if (!form.value.tracking_no.trim()) {
    showToast('请输入物流单号')
    return
  }

  try {
    await showConfirmDialog({ title: '提示', message: '确认提交发货信息？' })
  } catch {
    return
  }

  submitting.value = true
  try {
    await shipOrder(
      {
        order_id: orderId,
        delivery_method: form.value.delivery_method,
        tracking_no: form.value.tracking_no.trim(),
        shipping_fee: toNumber(form.value.shipping_fee),
      },
      { loading: false },
    )
    showToast('发货成功')
    router.back()
  } catch {
    // 错误由拦截器处理
  } finally {
    submitting.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="page">
    <van-loading v-if="loading" class="page-loading" color="#2563eb" />
    <template v-else-if="detail">
      <section class="card">
        <div class="card-header">订单概览</div>
        <div class="card-body">
          <div class="row">
            <span class="label">订单号</span>
            <span class="value">{{ detail.order_no }}</span>
          </div>
          <div class="row">
            <span class="label">应付</span>
            <span class="value">￥{{ formatMoney(detail.payable_amount) }}</span>
          </div>
          <div class="row">
            <span class="label">已付</span>
            <span class="value">￥{{ formatMoney(detail.paid_amount) }}</span>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-header">收货信息</div>
        <div class="card-body">
          <div class="row">
            <span class="label">收货人</span>
            <span class="value">{{ detail.receiver_name || '-' }}</span>
          </div>
          <div class="row">
            <span class="label">电话</span>
            <span class="value">{{ detail.receiver_phone || '-' }}</span>
          </div>
          <div class="row">
            <span class="label">地址</span>
            <span class="value">{{ detail.receiver_address || '-' }}</span>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-header">发货填写</div>
        <div class="card-body form-body">
          <van-cell-group inset>
            <van-cell title="配送方式" :value="form.delivery_method_label || '请选择'" is-link @click="openDeliverySheet" />
            <van-field
              v-model="form.tracking_no"
              label="物流单号"
              placeholder="请输入物流单号"
              clearable
            />
            <van-field
              v-model="form.shipping_fee"
              label="运费"
              placeholder="请输入运费"
              type="number"
              inputmode="decimal"
              clearable
            />
          </van-cell-group>
        </div>
      </section>

      <div class="submit-area">
        <van-button block type="primary" :loading="submitting" @click="onSubmit">确认发货</van-button>
      </div>
    </template>

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
  background: #f4f6fb;
  padding: 14px 14px 28px;
}

.page-loading {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(31, 42, 68, 0.08);
  overflow: hidden;
  margin-bottom: 14px;
}

.card-header {
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 700;
  color: #1f2a44;
  background: #f7f9ff;
  border-bottom: 1px solid rgba(31, 42, 68, 0.06);
}

.card-body {
  padding: 12px 14px 14px;
  display: grid;
  gap: 8px;
}

.form-body {
  padding: 0;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
}

.label {
  color: rgba(31, 42, 68, 0.55);
}

.value {
  color: #1f2a44;
  font-weight: 600;
  text-align: right;
  flex: 1;
  word-break: break-all;
}

.submit-area {
  margin-top: 10px;
}
</style>
