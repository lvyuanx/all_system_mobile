import axios from 'axios'
import { showToast, showLoadingToast, closeToast, showDialog } from 'vant'
import { useUserStore } from '@/stores/user'

// 创建 axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 显示 loading
    if (config.loading !== false) {
      showLoadingToast({
        message: '加载中...',
        forbidClick: true,
        duration: 0,
      })
    }

    // 可在此添加 token
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }

    const userStore = useUserStore()
    if (userStore.token) {
      const tokenValue = userStore.token.startsWith('Bearer ') ? userStore.token : `Bearer ${userStore.token}`
      config.headers = config.headers || {}
      config.headers[userStore.tokenTag] = tokenValue
    }

    return config
  },
  (error) => {
    closeToast()
    showToast({
      message: '请求发送失败',
      position: 'top',
    })
    return Promise.reject(error)
  },
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    closeToast()

    const { data } = response
    const { code, msg, level } = data

    // code 为 '0' 表示成功
    if (code === '0') {
      return data
    }

    // 根据 level 处理不同级别的错误
    const message = `${code}:${msg}`

    switch (level) {
      case 's': // 成功，不显示消息
        break
      case 'e': // 错误，使用 Dialog 显示
        showDialog({
          title: '请求发生错误',
          message,
        })
        break
      case 'w': // 警告，使用 Toast 提示
        showToast({
          message,
          position: 'top',
        })
        break
      case 'i': // 可忽略的错误，不提示
        break
      default:
        // 默认使用 Toast 提示
        showToast({
          message: msg || '请求失败',
          position: 'top',
        })
    }

    return Promise.reject(new Error(msg || '请求失败'))
  },
  (error) => {
    closeToast()

    let message = '网络错误，请稍后重试'

    if (error.response) {
      const { status } = error.response
      switch (status) {
        case 400:
          message = '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          // 可在此处理登录过期，跳转到登录页
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求地址不存在'
          break
        case 408:
          message = '请求超时'
          break
        case 500:
          message = '服务器内部错误'
          break
        case 501:
          message = '服务未实现'
          break
        case 502:
          message = '网关错误'
          break
        case 503:
          message = '服务不可用'
          break
        case 504:
          message = '网关超时'
          break
        case 505:
          message = 'HTTP版本不受支持'
          break
        default:
          message = `请求失败 (${status})`
      }
    } else if (error.code === 'ECONNABORTED') {
      message = '请求超时，请稍后重试'
    } else if (error.message?.includes('Network Error')) {
      message = '网络连接失败，请检查网络'
    }

    showToast({
      message,
      position: 'top',
    })

    return Promise.reject(error)
  },
)

// 封装请求方法
const http = {
  get: (url, params = {}, config = {}) =>
    request.get(url, { params, ...config }),

  post: (url, data = {}, config = {}) =>
    request.post(url, data, config),

  put: (url, data = {}, config = {}) =>
    request.put(url, data, config),

  patch: (url, data = {}, config = {}) =>
    request.patch(url, data, config),

  delete: (url, config = {}) =>
    request.delete(url, config),

  upload: (url, data = {}, config = {}) => {
    const formData = new FormData()
    // 支持 File 对象或包含参数的对象
    if (data instanceof File) {
      formData.append('file', data)
    } else {
      Object.keys(data).forEach((key) => {
        const value = data[key]
        // 处理文件数组
        if (Array.isArray(value)) {
          value.forEach((item) => {
            formData.append(key, item)
          })
        } else {
          formData.append(key, value)
        }
      })
    }
    return request.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    })
  },

  download: (url, params = {}, config = {}) =>
    request.get(url, {
      params,
      responseType: 'blob',
      ...config,
    }),
}

export default http
