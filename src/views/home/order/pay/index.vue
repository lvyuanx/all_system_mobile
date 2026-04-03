<script setup>
defineOptions({ name: 'OrderPay' })
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { getOrderInfo, getOrderPayCaList, getPayMethodTypeList, payOrder } from '@/api/order'
import { formatMoney, toNumber } from '@/utils/orderConstants'

const route = useRoute()
const router = useRouter()

const orderId = Number(route.query.id || route.query.order_id || 0)
const loading = ref(false)
const submitting = ref(false)

const detail = ref(null)
const payList = ref([])
const payMethods = ref([])
const showMethodSheet = ref(false)

const form = ref({
  pay_method: null,
  pay_method_label: '',
  pay_amount: '',
  operator_memo: '',
})

const remainingAmount = computed(() => {
  if (!detail.value) return 0
  const payable = toNumber(detail.value.payable_amount)
  const paid = toNumber(detail.value.paid_amount)
  return payable - paid
})

const fetchData = async () => {
  if (!orderId) {
    showToast('缺少订单信息')
    router.back()
    return
  }
  loading.value = true
  try {
    const [orderRes, methodRes, listRes] = await Promise.all([
      getOrderInfo(orderId, { loading: false }),
      getPayMethodTypeList({ loading: false }),
      getOrderPayCaList(orderId, { loading: false }),
    ])
    detail.value = orderRes?.data || null
    const methods = methodRes?.data || []
    payMethods.value = methods.map((item) => ({
      name: item.label || item.name,
      value: item.value,
    }))

    if (!form.value.pay_method && payMethods.value.length) {
      form.value.pay_method = payMethods.value[0].value
      form.value.pay_method_label = payMethods.value[0].name
    }

    payList.value = listRes?.data || []
    if (remainingAmount.value > 0 && !form.value.pay_amount) {
      form.value.pay_amount = remainingAmount.value.toFixed(2)
    }
  } catch {
    showToast('支付信息加载失败')
  } finally {
    loading.value = false
  }
}

const openMethodSheet = () => {
  if (!payMethods.value.length) return
  showMethodSheet.value = true
}

const onSelectMethod = (action) => {
  form.value.pay_method = action.value
  form.value.pay_method_label = action.name
  showMethodSheet.value = false
}

const onSubmit = async () => {
  if (submitting.value) return
  if (!form.value.pay_method) {
    showToast('请选择支付方式')
    return
  }
  const amount = toNumber(form.value.pay_amount)
  if (amount <= 0) {
    showToast('请输入有效收款金额')
    return
  }
  if (amount - remainingAmount.value > 0.0001) {
    showToast('收款金额超过应付余额')
    return
  }

  try {
    await showConfirmDialog({ title: '提示', message: '确认提交收款？' })
  } catch {
    return
  }

  submitting.value = true
  try {
    await payOrder(
      {
        order_id: orderId,
        pay_amount: amount,
        pay_method: form.value.pay_method,
        operator_memo: form.value.operator_memo || '',
      },
      { loading: false },
    )
    showToast('收款成功')
    form.value.operator_memo = ''
    await fetchData()
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
          <div class="row">
            <span class="label">余额</span>
            <span class="value">￥{{ formatMoney(remainingAmount) }}</span>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-header">收款登记</div>
        <div class="card-body form-body">
          <van-cell-group inset>
            <van-cell title="支付方式" :value="form.pay_method_label || '请选择'" is-link @click="openMethodSheet" />
            <van-field
              v-model="form.pay_amount"
              label="收款金额"
              placeholder="请输入收款金额"
              type="number"
              inputmode="decimal"
              clearable
            />
            <van-field
              v-model="form.operator_memo"
              label="备注"
              placeholder="可填写收款备注"
              clearable
            />
          </van-cell-group>
        </div>
        <div class="submit-area">
          <van-button block type="primary" :loading="submitting" @click="onSubmit">确认收款</van-button>
        </div>
      </section>

      <section class="card">
        <div class="card-header">支付流水</div>
        <div class="card-body">
          <div v-if="!payList.length" class="empty">暂无支付记录</div>
          <div v-for="(item, idx) in payList" :key="idx" class="pay-item">
            <div class="pay-row">
              <span class="pay-label">流水号</span>
              <span class="pay-value">{{ item.ca_no }}</span>
            </div>
            <div class="pay-row">
              <span class="pay-label">金额</span>
              <span class="pay-value">￥{{ formatMoney(item.pay_amount) }}</span>
            </div>
            <div class="pay-row">
              <span class="pay-label">方式</span>
              <span class="pay-value">{{ item.pay_method_str || '-' }}</span>
            </div>
            <div class="pay-row">
              <span class="pay-label">操作人</span>
              <span class="pay-value">{{ item.operator_info || '-' }}</span>
            </div>
            <div class="pay-row">
              <span class="pay-label">时间</span>
              <span class="pay-value">{{ item.operator_time_str || '-' }}</span>
            </div>
            <div class="pay-row" v-if="item.operator_memo">
              <span class="pay-label">备注</span>
              <span class="pay-value">{{ item.operator_memo }}</span>
            </div>
          </div>
        </div>
      </section>
    </template>

    <van-action-sheet
      v-model:show="showMethodSheet"
      :actions="payMethods"
      cancel-text="取消"
      @select="onSelectMethod"
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
  padding: 0 14px 14px;
}

.pay-item {
  padding: 12px;
  border-radius: 12px;
  background: #f9fafc;
  border: 1px solid rgba(31, 42, 68, 0.06);
  display: grid;
  gap: 6px;
}

.pay-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
}

.pay-label {
  color: rgba(31, 42, 68, 0.55);
}

.pay-value {
  color: #1f2a44;
  font-weight: 600;
  text-align: right;
  flex: 1;
  word-break: break-all;
}

.empty {
  font-size: 12px;
  color: rgba(31, 42, 68, 0.5);
  text-align: center;
  padding: 12px 0;
}
</style>
