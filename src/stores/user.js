import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { menuCache } from '@/utils/menuCache'

export const useUserStore = defineStore(
  'user',
  () => {
    const isLogin = ref(false)
    const token = ref('')
    const tokenTag = ref('Authorization')
    const permPacks = ref([])

    const userInfo = ref({
      username: '',
      nickname: '',
      avatar: '',
      date_joined: '',
      is_superuser: false,
    })
    const staffInfo = ref({
      staff_code: '',
      site_name: '',
    })

    const isLoggedIn = computed(() => isLogin.value)

    const login = (userData = {}) => {
      isLogin.value = true
      token.value = userData.token || ''
      tokenTag.value = userData.tokenTag || userData.token_tag || 'Authorization'
      permPacks.value = userData.perm_packs || userData.permPacks || []
      userInfo.value = {
        username: userData.username || '',
        nickname: userData.nickname || userData.username || '',
        avatar: userData.avatar || '',
        date_joined: userData.date_joined || '',
        is_superuser: userData.is_superuser || false,
      }
    }

    const logout = () => {
      isLogin.value = false
      token.value = ''
      tokenTag.value = 'Authorization'
      permPacks.value = []
      menuCache.clear()
      userInfo.value = {
        username: '',
        nickname: '',
        avatar: '',
        date_joined: '',
        is_superuser: false,
      }
      staffInfo.value = {
        staff_code: '',
        site_name: '',
      }
    }

    const updateUserInfo = (userData) => {
      userInfo.value = { ...userInfo.value, ...userData }
    }

    const updateStaffInfo = (staffData) => {
      staffInfo.value = { ...staffInfo.value, ...staffData }
    }

    return {
      isLogin,
      isLoggedIn,
      token,
      tokenTag,
      permPacks,
      userInfo,
      staffInfo,
      login,
      logout,
      updateUserInfo,
      updateStaffInfo,
    }
  },
  {
    persist: {
      key: 'user_state',
      paths: ['isLogin', 'userInfo', 'staffInfo', 'token', 'tokenTag', 'permPacks'],
      storage: localStorage,
    },
  },
)
