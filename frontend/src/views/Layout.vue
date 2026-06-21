<template>
  <el-container class="layout">
    <el-header class="header">
      <div class="header-inner">
        <div class="logo" @click="router.push('/')">
          <span class="logo-icon">🎓</span>
          <span class="logo-text">校园互助平台</span>
        </div>
        <div class="nav">
          <el-button text class="nav-btn" @click="router.push('/')">
            <el-icon><HomeFilled /></el-icon> 任务大厅
          </el-button>
          <template v-if="authStore.isLoggedIn">
            <el-button text class="nav-btn" @click="router.push('/tasks/create')">
              <el-icon><Plus /></el-icon> 发布任务
            </el-button>
            <el-button text class="nav-btn" @click="router.push('/messages')">
              <el-icon><ChatDotRound /></el-icon> 消息
            </el-button>
            <el-button text class="nav-btn" @click="router.push('/my')">
              <el-icon><List /></el-icon> 我的任务
            </el-button>
            <el-button text class="nav-btn" v-if="authStore.isAdmin" @click="router.push('/admin')">
              <el-icon><Setting /></el-icon> 管理
            </el-button>
            <el-dropdown trigger="click" @command="handleUserMenu">
              <div class="user-avatar">
                <el-avatar :size="32" :src="authStore.user?.avatar || ''" />
                <span class="user-name">{{ authStore.user?.username }}</span>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button text class="nav-btn" @click="router.push('/login')">登录</el-button>
            <el-button class="register-btn" @click="router.push('/register')">注册</el-button>
          </template>
        </div>
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
import { HomeFilled, Plus, ChatDotRound, List, Setting } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

function handleUserMenu(command) {
  if (command === 'profile') router.push('/profile')
  else if (command === 'logout') { authStore.logout(); router.push('/login') }
}
</script>

<style scoped>
.layout { min-height: 100vh; }

.header {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 0;
  height: 64px !important;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #e2e8f0, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 1px;
}

.nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-btn {
  color: #cbd5e1 !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  padding: 8px 14px !important;
  border-radius: 8px !important;
  transition: all 0.2s ease !important;
}

.nav-btn:hover {
  color: #fff !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

.user-avatar {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-avatar:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-name {
  color: #e2e8f0;
  font-size: 14px;
  font-weight: 500;
}

.register-btn {
  background: rgba(255, 255, 255, 0.15) !important;
  color: #e2e8f0 !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 8px !important;
  font-weight: 500 !important;
}

.register-btn:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  color: #fff !important;
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 24px;
}
</style>
