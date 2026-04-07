import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useClientSearchStore = defineStore(
  'client_search',
  () => {
    const recentKeywords = ref([])
    const pendingKeyword = ref(null)
    const MAX_SIZE = 10

    const addKeyword = (keyword) => {
      const value = String(keyword || '').trim()
      if (!value) return
      recentKeywords.value = recentKeywords.value.filter((item) => item !== value)
      recentKeywords.value.unshift(value)
      if (recentKeywords.value.length > MAX_SIZE) {
        recentKeywords.value = recentKeywords.value.slice(0, MAX_SIZE)
      }
    }

    const clearAll = () => {
      recentKeywords.value = []
    }

    const setPendingKeyword = (keyword) => {
      pendingKeyword.value = String(keyword ?? '')
    }

    const takePendingKeyword = () => {
      const value = pendingKeyword.value
      pendingKeyword.value = null
      return value
    }

    return {
      recentKeywords,
      pendingKeyword,
      addKeyword,
      clearAll,
      setPendingKeyword,
      takePendingKeyword,
    }
  },
  {
    persist: {
      key: 'client_search_state',
      paths: ['recentKeywords'],
      storage: localStorage,
    },
  },
)
