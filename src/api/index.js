import request from '@/utils/request'

// 用户相关接口示例
export const userApi = {
  // 登录
  login: (data) => request.post('/auth/login', data),

  // 登出
  logout: () => request.post('/auth/logout'),

  // 获取用户信息
  getUserInfo: () => request.get('/user/info'),

  // 更新用户信息
  updateUserInfo: (data) => request.put('/user/info', data),

  // 上传头像
  uploadAvatar: (file) => request.upload('/user/avatar', file),
}

export default request
