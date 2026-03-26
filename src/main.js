import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'
import './assets/global.css'
import './assets/glass-ui.css'

// 创建 Vue 应用
const app = createApp(App)

// 创建 Pinia 状态管理
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// 注册插件
app.use(pinia)
app.use(router)

// 挂载应用到移动端容器
app.mount('.mobile-container')
