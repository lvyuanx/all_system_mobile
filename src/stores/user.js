import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore(
  'user',
  () => {
    const isLogin = ref(false)
    const token = ref('')
    const tokenTag = ref('Authorization')

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
      paths: ['isLogin', 'userInfo', 'staffInfo', 'token', 'tokenTag'],
      storage: localStorage,
    },
  },
)
