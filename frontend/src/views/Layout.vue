<template>
  <el-container class="layout">
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <div class="header-inner">
        <div class="logo" @click="router.push('/')">
          <span class="logo-icon">🎓</span>
          <span class="logo-text">校园互助平台</span>
        </div>
        <div class="nav">
          <el-button
            :class="['nav-btn', { active: route.path === '/' }]"
            @click="router.push('/')"
          >
            📋 任务大厅
          </el-button>
          <template v-if="authStore.isLoggedIn">
            <el-button
              :class="['nav-btn', { active: route.path === '/tasks/create' }]"
              @click="router.push('/tasks/create')"
            >
              ✏️ 发布任务
            </el-button>
            <el-button
              :class="['nav-btn', { active: route.path === '/messages' }]"
              @click="router.push('/messages')"
            >
              💬 消息
            </el-button>
            <el-button
              :class="['nav-btn', { active: route.path === '/my' }]"
              @click="router.push('/my')"
            >
              📁 我的
            </el-button>
            <el-button
              v-if="authStore.isAdmin"
              :class="['nav-btn', { active: route.path === '/admin' }]"
              @click="router.push('/admin')"
            >
              ⚙️ 管理
            </el-button>
            <el-button
              :class="['nav-btn', { active: route.path === '/profile' }]"
              @click="router.push('/profile')"
            >
              👤 个人中心
            </el-button>
            <el-button class="nav-btn logout-btn" @click="handleLogout">
              退出
            </el-button>
          </template>
          <template v-else>
            <el-button
              :class="['nav-btn', { active: route.path === '/login' }]"
              @click="router.push('/login')"
            >
              登录
            </el-button>
            <el-button
              :class="['nav-btn', { active: route.path === '/register' }]"
              @click="router.push('/register')"
            >
              注册
            </el-button>
          </template>
        </div>
      </div>
    </el-header>

    <!-- 主内容区 -->
    <el-main class="main">
      <router-view v-slot="{ Component }">
        <transition name="router-view" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>
  </el-container>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
}

/* ====== 顶部导航栏 ====== */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 0;
  height: auto;
  background: linear-gradient(135deg, #2c3e6b 0%, #3b5998 50%, #4a6db5 100%);
  box-shadow: 0 4px 24px rgba(44, 62, 107, 0.25);
}

.header-inner {
  max-width: 1300px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}
.logo-icon { font-size: 28px; }
.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.15);
}

/* 导航按钮容器 */
.nav {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

/* 导航按钮 */
.nav-btn {
  background: transparent !important;
  border: 1px solid transparent !important;
  color: rgba(255,255,255,0.8) !important;
  font-size: 14px;
  padding: 6px 14px;
  border-radius: 8px !important;
  transition: all 0.25s ease;
}
.nav-btn:hover {
  background: rgba(255,255,255,0.12) !important;
  color: #fff !important;
  border-color: rgba(255,255,255,0.3) !important;
}
.nav-btn.active {
  background: rgba(255,255,255,0.2) !important;
  color: #fff !important;
  border-color: rgba(255,255,255,0.45) !important;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.logout-btn {
  color: rgba(255,255,255,0.55) !important;
  font-size: 13px;
}
.logout-btn:hover {
  color: #ffcccc !important;
}

/* ====== 主内容区 ====== */
.main {
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
  padding: 28px 20px 40px;
}
</style>
