import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { formatMoney, toNumber } from '@/utils/orderConstants'

const createEmptyItem = () => ({
  pattern_code: '',
  pattern_memo: '',
  pattern_image: '',
  color: '',
  count: 1,
  unit_price: '',
  discount_price: '0',
  total_unit: '元',
  memo: '',
})

const createDefaultDraft = () => ({
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
  items: [createEmptyItem()],
  scroll_top: 0,
})

const cloneDefaultDraft = () => ({
  ...createDefaultDraft(),
  items: [createEmptyItem()],
})

export const useOrderCreateStore = defineStore(
  'order_create',
  () => {
    const initialized = ref(false)
    const isDirty = ref(false)
    const draft = ref(cloneDefaultDraft())

    const ensureItems = () => {
      if (!Array.isArray(draft.value.items) || draft.value.items.length === 0) {
        draft.value.items = [createEmptyItem()]
      }
    }

    const sanitizeState = () => {
      draft.value = {
        ...cloneDefaultDraft(),
        ...draft.value,
        items: Array.isArray(draft.value.items) && draft.value.items.length
          ? draft.value.items.map((item) => ({
            ...createEmptyItem(),
            ...item,
            total_unit: String(item?.total_unit ?? '').trim() || '元',
          }))
          : [createEmptyItem()],
      }
      ensureItems()
    }

    const markDirty = (value = true) => {
      isDirty.value = value
    }

    const initializeDraft = () => {
      if (!initialized.value) {
        draft.value = cloneDefaultDraft()
        initialized.value = true
        isDirty.value = false
        return
      }
      sanitizeState()
    }

    const updateBaseInfo = (payload = {}, options = {}) => {
      const { markDirty: shouldMarkDirty = true } = options
      draft.value = {
        ...draft.value,
        ...payload,
      }
      if (shouldMarkDirty) markDirty()
    }

    const updateShippingParty = (payload = {}, options = {}) => {
      const { markDirty: shouldMarkDirty = true } = options
      draft.value = {
        ...draft.value,
        shipping_party: payload.shipping_party ?? draft.value.shipping_party,
        shipping_party_company: payload.shipping_party_company ?? draft.value.shipping_party_company,
        shipping_party_phone: payload.shipping_party_phone ?? draft.value.shipping_party_phone,
        shipping_party_address: payload.shipping_party_address ?? draft.value.shipping_party_address,
      }
      if (shouldMarkDirty) markDirty()
    }

    const updateReceiver = (payload = {}, options = {}) => {
      const { markDirty: shouldMarkDirty = true } = options
      draft.value = {
        ...draft.value,
        receiver_name: payload.receiver_name ?? draft.value.receiver_name,
        receiver_company: payload.receiver_company ?? draft.value.receiver_company,
        receiver_phone: payload.receiver_phone ?? draft.value.receiver_phone,
        receiver_address: payload.receiver_address ?? draft.value.receiver_address,
      }
      if (shouldMarkDirty) markDirty()
    }

    const addItem = () => {
      ensureItems()
      draft.value.items.push(createEmptyItem())
      markDirty()
    }

    const removeItem = (index) => {
      ensureItems()
      if (draft.value.items.length <= 1) return false
      draft.value.items.splice(index, 1)
      markDirty()
      return true
    }

    const updateItem = (index, patch = {}, options = {}) => {
      const { markDirty: shouldMarkDirty = true } = options
      ensureItems()
      if (!draft.value.items[index]) {
        draft.value.items[index] = createEmptyItem()
      }
      draft.value.items[index] = {
        ...draft.value.items[index],
        ...patch,
      }
      if (shouldMarkDirty) markDirty()
    }

    const applyPatternToItem = (index, pattern = {}, options = {}) => {
      const { markDirty: shouldMarkDirty = true } = options
      updateItem(
        index,
        {
          pattern_code: pattern.pattern_code || '',
          pattern_memo: pattern.pattern_memo || '',
          pattern_image: pattern.main_image || pattern.pattern_image || '',
        },
        { markDirty: shouldMarkDirty },
      )
    }

    const itemTotals = computed(() =>
      (draft.value.items || []).map((item) => {
        const count = toNumber(item.count)
        const unitPrice = toNumber(item.unit_price)
        const discountPrice = toNumber(item.discount_price)
        const total = count * unitPrice
        const payable = total - discountPrice
        return {
          total,
          payable,
        }
      }),
    )

    const totals = computed(() => {
      let total = 0
      let discount = 0
      for (const item of draft.value.items || []) {
        total += toNumber(item.count) * toNumber(item.unit_price)
        discount += toNumber(item.discount_price)
      }
      return {
        total,
        discount,
        payable: total - discount,
      }
    })

    const formattedPayable = computed(() => formatMoney(totals.value.payable))
    const itemCount = computed(() => (draft.value.items || []).length)
    const shippingSummary = computed(() =>
      [draft.value.shipping_party, draft.value.shipping_party_company].filter(Boolean).join(' / '),
    )
    const receiverSummary = computed(() =>
      [draft.value.receiver_name, draft.value.receiver_company].filter(Boolean).join(' / '),
    )

    const validateBeforeSubmit = () => {
      if (!draft.value.site_id) {
        return { valid: false, message: '请选择站点', section: 'base' }
      }
      if (!draft.value.order_type) {
        return { valid: false, message: '请选择订单类型', section: 'base' }
      }
      if (!draft.value.delivery_method) {
        return { valid: false, message: '请选择配送方式', section: 'base' }
      }

      if (!String(draft.value.shipping_party || '').trim()) {
        return { valid: false, message: '请输入发货方', section: 'shipping' }
      }
      if (!String(draft.value.shipping_party_phone || '').trim()) {
        return { valid: false, message: '请输入发货方电话', section: 'shipping' }
      }
      if (!String(draft.value.shipping_party_address || '').trim()) {
        return { valid: false, message: '请输入发货方地址', section: 'shipping' }
      }

      if (!String(draft.value.receiver_name || '').trim()) {
        return { valid: false, message: '请输入收货人', section: 'receiver' }
      }
      if (!String(draft.value.receiver_phone || '').trim()) {
        return { valid: false, message: '请输入收货人电话', section: 'receiver' }
      }
      if (!String(draft.value.receiver_address || '').trim()) {
        return { valid: false, message: '请输入收货地址', section: 'receiver' }
      }

      for (let index = 0; index < draft.value.items.length; index += 1) {
        const item = draft.value.items[index]
        if (!String(item.pattern_code || '').trim()) {
          return { valid: false, message: `请选择订单项 ${index + 1} 的款号`, section: 'items', index }
        }
        if (!String(item.color || '').trim()) {
          return { valid: false, message: `请输入订单项 ${index + 1} 的颜色`, section: 'items', index }
        }
        if (toNumber(item.count) <= 0) {
          return { valid: false, message: `订单项 ${index + 1} 的数量必须大于 0`, section: 'items', index }
        }
        if (!String(item.total_unit || '').trim()) {
          return { valid: false, message: `请输入订单项 ${index + 1} 的价格单位`, section: 'items', index }
        }
        if (toNumber(item.unit_price) <= 0) {
          return { valid: false, message: `订单项 ${index + 1} 的单价必须大于 0`, section: 'items', index }
        }
      }

      return { valid: true }
    }

    const buildCreatePayload = () => ({
      site_id: draft.value.site_id,
      order_type: draft.value.order_type,
      shipping_party: String(draft.value.shipping_party || '').trim(),
      shipping_party_company: String(draft.value.shipping_party_company || '').trim(),
      shipping_party_phone: String(draft.value.shipping_party_phone || '').trim(),
      shipping_party_address: String(draft.value.shipping_party_address || '').trim(),
      delivery_method: draft.value.delivery_method,
      receiver_name: String(draft.value.receiver_name || '').trim(),
      receiver_phone: String(draft.value.receiver_phone || '').trim(),
      receiver_address: String(draft.value.receiver_address || '').trim(),
      receiver_company: String(draft.value.receiver_company || '').trim(),
      memo: draft.value.memo || '',
      items: (draft.value.items || []).map((item) => ({
        pattern_code: String(item.pattern_code || '').trim(),
        color: String(item.color || '').trim(),
        count: toNumber(item.count),
        unit_price: toNumber(item.unit_price),
        discount_price: toNumber(item.discount_price),
        total_unit: String(item.total_unit || '').trim() || '元',
        memo: item.memo || '',
      })),
    })

    const resetDraft = () => {
      draft.value = cloneDefaultDraft()
      initialized.value = false
      isDirty.value = false
    }

    const setScrollTop = (value) => {
      const nextValue = Number(value)
      draft.value.scroll_top = Number.isNaN(nextValue) ? 0 : Math.max(0, nextValue)
    }

    sanitizeState()

    return {
      initialized,
      isDirty,
      draft,
      totals,
      itemTotals,
      itemCount,
      formattedPayable,
      shippingSummary,
      receiverSummary,
      setScrollTop,
      initializeDraft,
      updateBaseInfo,
      updateShippingParty,
      updateReceiver,
      addItem,
      removeItem,
      updateItem,
      applyPatternToItem,
      validateBeforeSubmit,
      buildCreatePayload,
      resetDraft,
    }
  },
  {
    persist: {
      key: 'order_create_state',
      paths: ['initialized', 'isDirty', 'draft'],
      storage: localStorage,
    },
  },
)
