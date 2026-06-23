import { createRouter, createWebHistory } from 'vue-router'
import ConsistencyPage from '../views/ConsistencyPage.vue'
import CodeAddingPage from '../views/CodeAddingPage.vue'

const routes = [
  {
    path: '/',
    redirect: '/consistency' // 默认跳转到 Consistency
  },
  {
    path: '/consistency',
    name: 'Consistency',
    component: ConsistencyPage
  },
  {
    path: '/codeadding',
    name: 'CodeAdding',
    component: CodeAddingPage
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router