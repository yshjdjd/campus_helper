<template>
  <div class="task-list">
    <!-- Hero 搜索区域 -->
    <div class="hero-section">
      <h1 class="hero-title">发现校园互助任务</h1>
      <p class="hero-subtitle">找人帮忙、组队学习、二手交易，一站搞定</p>
      <div class="search-bar">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索任务标题或描述..."
          size="large"
          clearable
          @keyup.enter="onSearch"
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" size="large" @click="onSearch" class="search-btn">搜索</el-button>
      </div>
      <div class="filters">
        <el-select v-model="filters.category_id" clearable placeholder="全部分类" size="large" @change="onCategoryChange">
          <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-select v-model="filters.status" clearable placeholder="全部状态" size="large" @change="onSearch">
          <el-option label="招募中" value="recruiting" />
          <el-option label="进行中" value="in_progress" />
          <el-option label="已完成" value="completed" />
        </el-select>
      </div>
      <!-- 学业互助：学科搜索 -->
      <div class="extra-filters" v-if="filters.category_id == 2">
        <el-select v-model="filters.subject" clearable filterable allow-create placeholder="筛选或输入学科" size="large" @change="onSearch" class="extra-input">
          <el-option v-for="s in subjects" :key="s" :label="s" :value="s" />
        </el-select>
      </div>
      <!-- 跑腿代拿：地点搜索 -->
      <div class="extra-filters" v-if="filters.category_id == 1">
        <el-input v-model="filters.pickup_location" placeholder="搜索代拿地..." size="large" clearable @keyup.enter="onSearch" @clear="onSearch" class="extra-input" />
        <el-input v-model="filters.delivery_location" placeholder="搜索目的地..." size="large" clearable @keyup.enter="onSearch" @clear="onSearch" class="extra-input" />
      </div>
    </div>

    <!-- 任务卡片 -->
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="8" v-for="task in tasks" :key="task.id">
        <el-card class="task-card" @click="router.push(`/tasks/${task.id}`)">
          <div class="task-header">
            <el-tag type="info" size="small">{{ task.category_name }}</el-tag>
            <el-tag :type="statusTagMap[task.status]" effect="plain" size="small">{{ statusMap[task.status] }}</el-tag>
          </div>
          <h3 class="task-title">{{ task.title }}</h3>
          <p class="task-desc">{{ task.description?.substring(0, 80) }}...</p>
          <div class="task-subject" v-if="task.subject">
            <span class="subject-tag">📚 {{ task.subject }}</span>
          </div>
          <div class="task-locations" v-if="task.pickup_location">
            <span class="loc-tag">📦 代拿地：{{ task.pickup_location }}</span>
            <span class="loc-arrow">→</span>
            <span class="loc-tag">📍 目的地：{{ task.delivery_location }}</span>
          </div>
          <div class="task-team" v-if="task.category_id === 3 && task.max_acceptors">
            <span class="team-tag">👥 {{ task.acceptor_count || 0 }}/{{ task.max_acceptors }} 人（剩余 {{ Math.max(0, task.max_acceptors - (task.acceptor_count || 0)) }} 人）</span>
          </div>
          <div class="task-footer">
            <div class="task-meta">
              <el-avatar :size="20" :src="task.publisher_avatar || ''" />
              <span>{{ task.publisher_name }}</span>
            </div>
            <span class="reward" v-if="task.reward > 0">💰 {{ task.reward }}</span>
            <span class="reward-free" v-else>免费</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 空状态 -->
    <div v-if="tasks.length === 0 && !loading" class="empty-state">
      <el-icon :size="48"><Box /></el-icon>
      <p>暂无任务，换个关键词试试</p>
    </div>

    <!-- 加载状态 / 没有更多 -->
    <div class="load-more-status" v-if="tasks.length > 0">
      <div v-if="loading" class="loading-indicator">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      <div v-else-if="noMore" class="no-more">
        <span>—— 已经到底了 ——</span>
      </div>
      <div v-else ref="sentinelRef" class="sentinel"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Box, Loading } from '@element-plus/icons-vue'
import api from '../api'

const router = useRouter()
const tasks = ref([])
const categories = ref([])
const total = ref(0)
const page = ref(1)
const limit = 9
const loading = ref(false)
const noMore = ref(false)
const sentinelRef = ref(null)
const filters = reactive({ category_id: '', status: '', keyword: '', subject: '', pickup_location: '', delivery_location: '' })

const subjects = [
  '高等数学', '线性代数', '概率论', '大学物理', '大学英语',
  'Python', 'C语言', 'Java', '数据结构', '操作系统',
  '计算机网络', '数据库', '人工智能', '机器学习',
  '会计学', '经济学', '管理学', '法学', '医学', '其他',
]

let observer = null

const statusMap = { recruiting: '招募中', in_progress: '进行中', completed: '已完成', cancelled: '已取消' }
const statusTagMap = { recruiting: 'primary', in_progress: 'warning', completed: 'success', cancelled: 'info' }

async function loadCategories() {
  try { const res = await api.get('/categories'); categories.value = res.data.data }
  catch (err) { console.error('Load categories error:', err) }
}

function buildParams() {
  const params = { page: page.value, limit }
  if (filters.category_id) params.category_id = filters.category_id
  if (filters.status) params.status = filters.status
  if (filters.keyword) params.keyword = filters.keyword
  if (filters.subject) params.subject = filters.subject
  if (filters.pickup_location) params.pickup_location = filters.pickup_location
  if (filters.delivery_location) params.delivery_location = filters.delivery_location
  return params
}

async function loadTasks() {
  if (loading.value || noMore.value) return
  loading.value = true
  try {
    const res = await api.get('/tasks', { params: buildParams() })
    const newRows = res.data.data.rows
    total.value = res.data.data.total

    if (page.value === 1) {
      tasks.value = newRows
    } else {
      tasks.value = [...tasks.value, ...newRows]
    }

    // 判断是否还有更多
    if (tasks.value.length >= total.value || newRows.length < limit) {
      noMore.value = true
    }
  } catch (err) { console.error('Load tasks error:', err) }
  finally {
    loading.value = false
    // 重新观察哨兵元素
    nextTick(() => observeSentinel())
  }
}

/** 切换分类时清除专属筛选项 */
function onCategoryChange() {
  filters.subject = ''
  filters.pickup_location = ''
  filters.delivery_location = ''
  onSearch()
}

/** 搜索/筛选时重置 */
function onSearch() {
  if (observer) { observer.disconnect(); observer = null }
  page.value = 1
  noMore.value = false
  tasks.value = []
  loading.value = false
  loadTasks()
}

/** 设置 IntersectionObserver */
function observeSentinel() {
  if (observer) observer.disconnect()
  if (!sentinelRef.value || noMore.value) return

  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !loading.value && !noMore.value) {
      page.value++
      loadTasks()
    }
  }, { rootMargin: '200px' })  // 提前 200px 触发

  observer.observe(sentinelRef.value)
}

onMounted(() => {
  loadCategories()
  loadTasks()
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<style scoped>
/* Hero 搜索区域 */
.hero-section {
  text-align: center;
  padding: 40px 20px 32px;
  margin-bottom: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: #fff;
}

.hero-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.hero-subtitle {
  font-size: 15px;
  opacity: 0.85;
  margin-bottom: 28px;
}

.search-bar {
  display: flex;
  max-width: 640px;
  margin: 0 auto 20px;
  gap: 12px;
}

.search-input {
  flex: 1;
}

.search-input :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
  padding: 4px 16px;
  height: 48px;
}

.search-input :deep(.el-input__inner) {
  font-size: 16px;
}

.search-btn {
  height: 48px;
  padding: 0 28px;
  border-radius: 12px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
}

.filters {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.filters :deep(.el-select) {
  width: 160px;
}

.filters :deep(.el-select .el-input__wrapper) {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px !important;
  box-shadow: none !important;
}

.filters :deep(.el-select .el-input__inner) {
  color: #fff;
}

.filters :deep(.el-select .el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.7);
}

.extra-filters {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
}
.extra-input {
  width: 200px;
}
.extra-input :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px !important;
  box-shadow: none !important;
}
.extra-input :deep(.el-input__inner) {
  color: #fff;
}
.extra-input :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.7);
}
.extra-input :deep(.el-select .el-input__wrapper) {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px !important;
  box-shadow: none !important;
}
.extra-input :deep(.el-select .el-input__inner) {
  color: #fff;
}

/* 任务卡片 */
.task-card {
  cursor: pointer;
  margin-bottom: 20px;
  border-radius: 12px !important;
  transition: all 0.3s ease !important;
}

.task-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1) !important;
}

.task-header {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.task-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
  line-height: 1.4;
}

.task-desc {
  color: #86909c;
  font-size: 13px;
  margin: 0 0 10px;
  line-height: 1.6;
}

.task-subject { margin-bottom: 10px; }
.subject-tag {
  display: inline-block;
  padding: 2px 10px;
  background: linear-gradient(135deg, #fef7e0 0%, #fdecc8 100%);
  border: 1px solid #f3d19e;
  border-radius: 6px;
  color: #b8860b;
  font-size: 12px;
  font-weight: 500;
}

.task-locations {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 6px 10px;
  background: linear-gradient(135deg, #f0f5ff 0%, #e8f4fd 100%);
  border-radius: 8px;
  border: 1px solid #d6e4ff;
  font-size: 12px;
}
.loc-tag { color: #4a6fa5; font-weight: 500; }
.loc-arrow { color: #a0c4ff; font-weight: bold; }

.task-team { margin-bottom: 10px; }
.team-tag {
  display: inline-block;
  padding: 3px 10px;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border: 1px solid #a5d6a7;
  border-radius: 6px;
  color: #2e7d32;
  font-size: 12px;
  font-weight: 500;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f2f3f5;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #86909c;
}

.reward {
  color: #f77234;
  font-weight: 700;
  font-size: 15px;
}

.reward-free {
  color: #00b42a;
  font-size: 13px;
  font-weight: 500;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #c0c4cc;
}

.empty-state p {
  margin-top: 12px;
  font-size: 14px;
}

/* 加载状态 */
.load-more-status {
  text-align: center;
  padding: 24px 0 8px;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #86909c;
  font-size: 14px;
}

.loading-indicator .is-loading {
  font-size: 18px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.no-more {
  color: #c0c4cc;
  font-size: 13px;
}

.sentinel {
  height: 1px;
}
</style>
