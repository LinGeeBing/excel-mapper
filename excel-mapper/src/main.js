import { createApp } from 'vue'
import App from './App.vue'
import router from './router'  //引入路由配置文件
import ElementPlus from 'element-plus'  // 引入 Element Plus
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs' // 引入中文语言包

// 创建 Vue 应用
const app = createApp(App)

// 使用 Element Plus
app.use(ElementPlus, {
  locale: zhCn, // 设置全局语言为中文
})
app.use(router)

// 挂载应用
app.mount('#app')