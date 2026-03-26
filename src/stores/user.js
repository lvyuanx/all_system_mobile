import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore(
  'user',
  () => {
    // 用户登录状态
    const isLogin = ref(false)

    // 用户信息
    const userInfo = ref({
      username: '',
      nickname: '',
      avatar: '',
    })

    // 是否已登录
    const isLoggedIn = computed(() => isLogin.value)

    // 登录
    const login = (userData = {}) => {
      isLogin.value = true
      userInfo.value = {
        username: userData.username || '',
        nickname: userData.nickname || userData.username || '',
        avatar: userData.avatar || '',
      }
    }

    // 登出（只清除状态，路由跳转由调用方处理）
    const logout = () => {
      isLogin.value = false
      userInfo.value = {
        username: '',
        nickname: '',
        avatar: '',
      }
    }

    // 更新用户信息
    const updateUserInfo = (userData) => {
      userInfo.value = { ...userInfo.value, ...userData }
    }

    return {
      isLogin,
      isLoggedIn,
      userInfo,
      login,
      logout,
      updateUserInfo,
    }
  },
  {
    persist: {
      key: 'user_state',
      paths: ['isLogin', 'userInfo'],
      storage: localStorage,
    },
  },
)
