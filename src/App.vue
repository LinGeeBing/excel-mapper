<template>
  <div class="layout">
    <!-- 左侧菜单 -->
    <div class="sidebar">
      <div class="logo">表格处理</div>
      <el-menu
        :default-active="route.path"
        router
        class="menu"
      >
        <el-menu-item index="/consistency">
          <el-icon><Document /></el-icon>
          <span font-size="20px">表格模版统一</span>
        </el-menu-item>

        <el-menu-item index="/codeadding">
          <el-icon><Box /></el-icon>
          <span>添加商品编码</span>
        </el-menu-item>
      </el-menu>
    </div>

    <!-- 右侧区域 -->
    <div class="main">
      <!-- 顶部 Header -->
      <!-- <div class="header">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">
            Home
          </el-breadcrumb-item>
          <el-breadcrumb-item>
            {{ currentTitle }}
          </el-breadcrumb-item>
        </el-breadcrumb>

        <div class="title">{{ currentTitle }}</div>
      </div> -->

      <!-- 页面内容 -->
      <div class="content">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { Document, Box } from '@element-plus/icons-vue'

const route = useRoute()

const currentTitle = computed(() => {
  switch (route.path) {
    case '/consistency':
      return 'Consistency'
    case '/codeadding':
      return 'Code Adding'
    default:
      return 'Dashboard'
  }
})
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  font-family: Arial, sans-serif;
}

/* 左侧 */
.sidebar {
  width: 220px;
}

.logo {
  color: rgb(34, 116, 184);
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  border-bottom: 3px solid #727c88;
}

/* 右侧 */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

/* 内容区 */
.content {
  flex: 1;
  padding: 15px;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
/* 纯CSS单独写滚动条样式 */
.content::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
</style>