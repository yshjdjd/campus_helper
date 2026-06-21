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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  background-color: #f0f2f5;
  color: #1d2129;
  -webkit-font-smoothing: antialiased;
}

/* 全局卡片样式 */
.el-card {
  border: none !important;
  border-radius: 12px !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04) !important;
  transition: box-shadow 0.3s ease, transform 0.2s ease !important;
}

.el-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04) !important;
}

/* 全局按钮样式 */
.el-button--primary {
  background: linear-gradient(135deg, #409eff, #337ecc) !important;
  border: none !important;
  font-weight: 500 !important;
}

.el-button--primary:hover {
  background: linear-gradient(135deg, #66b1ff, #409eff) !important;
}

/* 全局输入框 */
.el-input__wrapper {
  border-radius: 8px !important;
  transition: box-shadow 0.3s ease !important;
}

/* 全局标签 */
.el-tag {
  border-radius: 6px !important;
  border: none !important;
  font-weight: 500 !important;
}

/* 分页器居中 */
.el-pagination {
  justify-content: center !important;
}
</style>
