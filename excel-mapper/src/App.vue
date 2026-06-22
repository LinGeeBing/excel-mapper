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
  /* background: #fcfdfd; */
  color: #fff;
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

.menu {
  border-right: none;
  background: transparent;
}

/* 右侧 */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

/* Header */
.header {
  height: 60px;
  background: #fff;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.title {
  font-size: 18px;
  font-weight: 600;
  margin-top: 2px;
}

/* 内容区 */
.content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
}
</style>