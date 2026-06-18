<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<script setup>
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  background: linear-gradient(135deg, #e8edf5 0%, #f0f2f8 30%, #eaf0f8 60%, #f5f6fa 100%);
  background-attachment: fixed;
  min-height: 100vh;
  position: relative;
}

/* 背景装饰光斑 */
body::before {
  content: '';
  position: fixed;
  top: -50%;
  right: -30%;
  width: 80%;
  height: 100%;
  background: radial-gradient(ellipse, rgba(64, 158, 255, 0.06) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

body::after {
  content: '';
  position: fixed;
  bottom: -40%;
  left: -20%;
  width: 70%;
  height: 80%;
  background: radial-gradient(ellipse, rgba(147, 112, 219, 0.04) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

#app {
  position: relative;
  z-index: 1;
}

/* 页面切换淡入动画 */
.router-view-enter-active {
  animation: fadeSlideIn 0.35s ease;
}
@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Element Plus 卡片统一样式 */
.el-card {
  border-radius: 12px !important;
  border: 1px solid #e4e7ed !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06) !important;
  transition: box-shadow 0.3s ease;
}

.el-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;
}

/* 按钮圆角 */
.el-button {
  border-radius: 8px;
}

/* 输入框圆角 */
.el-input__wrapper {
  border-radius: 8px !important;
}

/* 选择器圆角 */
.el-select .el-input__wrapper {
  border-radius: 8px !important;
}
</style>
