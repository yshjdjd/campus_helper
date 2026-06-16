<template>
  <el-container class="layout">
    <el-header class="header">
      <div class="logo" @click="router.push('/')">校园互助平台</div>
      <div class="nav">
        <el-button text @click="router.push('/')">任务大厅</el-button>
        <template v-if="authStore.isLoggedIn">
          <el-button text @click="router.push('/tasks/create')">发布任务</el-button>
          <el-button text @click="router.push('/messages')">消息</el-button>
          <el-button text @click="router.push('/my')">我的</el-button>
          <el-button text v-if="authStore.isAdmin" @click="router.push('/admin')">管理</el-button>
          <el-button text @click="router.push('/profile')">个人中心</el-button>
          <el-button text @click="handleLogout">退出</el-button>
        </template>
        <template v-else>
          <el-button text @click="router.push('/login')">登录</el-button>
          <el-button text @click="router.push('/register')">注册</el-button>
        </template>
      </div>
    </el-header>
    <el-main class="main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout { min-height: 100vh; }
.header {
  display: flex; align-items: center; justify-content: space-between;
  background: #409eff; color: #fff; padding: 0 24px;
}
.logo { font-size: 20px; font-weight: bold; cursor: pointer; }
.nav .el-button { color: #fff; }
.main { max-width: 1200px; margin: 0 auto; width: 100%; padding: 24px; }
</style>
