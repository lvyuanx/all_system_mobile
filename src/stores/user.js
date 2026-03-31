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
      }
    }

    const updateUserInfo = (userData) => {
      userInfo.value = { ...userInfo.value, ...userData }
    }

    return {
      isLogin,
      isLoggedIn,
      token,
      tokenTag,
      userInfo,
      login,
      logout,
      updateUserInfo,
    }
  },
  {
    persist: {
      key: 'user_state',
      paths: ['isLogin', 'userInfo', 'token', 'tokenTag'],
      storage: localStorage,
    },
  },
)
