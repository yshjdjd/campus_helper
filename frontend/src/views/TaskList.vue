<template>
  <div class="task-list">
    <!-- 分类滑块 -->
    <div class="category-slider">
      <div class="slider-wrapper">
        <button class="slider-arrow slider-left" @click="scrollSlider(-1)">◀</button>
        <div class="category-cards" ref="sliderRef">
          <div :class="['category-card', { active: !filters.category_id }]" @click="clearCategory">
            <span class="category-icon">🌐</span>
            <span class="category-name">全部</span>
          </div>
          <div
            v-for="c in categories"
            :key="c.id"
            :class="['category-card', { active: filters.category_id == c.id }]"
            @click="selectCategory(c)"
          >
            <span class="category-icon">{{ categoryIcons[c.id] || '📌' }}</span>
            <span class="category-name">{{ c.name }}</span>
          </div>
        </div>
        <button class="slider-arrow slider-right" @click="scrollSlider(1)">▶</button>
      </div>
    </div>

    <!-- 粘性搜索工具栏 -->
    <div class="search-toolbar" ref="toolbarRef">
      <div class="toolbar-inner">
        <div class="search-row">
          <el-input v-model="filters.keyword" placeholder="搜索任务..." size="large" clearable @keyup.enter="onSearch" @clear="onSearch" class="search-input">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-select v-model="filters.status" clearable placeholder="状态" size="large" @change="onSearch" class="status-select">
            <el-option label="招募中" value="recruiting" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
          <el-button type="primary" size="large" @click="onSearch" class="search-btn">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
        </div>
        <div class="search-row" v-if="searchableFields.length > 0">
          <el-select v-if="searchableFields.some(f => f.key === 'subject')" v-model="filters.searchValues.subject" clearable filterable allow-create placeholder="筛选学科" size="default" @change="onSearch" style="width:180px">
            <el-option v-for="s in subjectOptions" :key="s" :label="s" :value="s" />
          </el-select>
          <template v-for="f in searchableFields" :key="f.key">
            <el-input v-if="f.key !== 'subject'" v-model="filters.searchValues[f.key]" :placeholder="'搜索' + f.label" size="default" clearable @keyup.enter="onSearch" @clear="onSearch" style="width:180px" />
          </template>
        </div>
        <div class="search-row" v-if="filters.category_id == 4">
          <span class="price-label">💰 金额</span>
          <el-input-number v-model="filters.reward_min" placeholder="最低" :min="0" size="default" @change="onSearch" style="width:130px" />
          <span class="price-sep">—</span>
          <el-input-number v-model="filters.reward_max" placeholder="最高" :min="0" size="default" @change="onSearch" style="width:130px" />
          <el-button v-if="filters.reward_min || filters.reward_max" text size="small" @click="filters.reward_min=null;filters.reward_max=null;onSearch()">清除</el-button>
        </div>
        <div class="active-filters" v-if="hasActiveFilters">
          <el-tag v-if="filters.keyword" closable type="primary" @close="filters.keyword='';onSearch()">🔍 {{ filters.keyword }}</el-tag>
          <el-tag v-if="filters.status" closable type="warning" @close="filters.status='';onSearch()">{{ statusMap[filters.status] }}</el-tag>
          <el-tag v-for="(v,k) in filters.searchValues" :key="k" v-if="v" closable @close="filters.searchValues[k]='';onSearch()">{{ k }}: {{ v }}</el-tag>
          <el-button v-if="hasActiveFilters" text type="danger" size="small" @click="clearAllFilters">清除全部</el-button>
        </div>
      </div>
    </div>

    <!-- 任务卡片 -->
    <div ref="taskSectionRef">
    <TransitionGroup name="task-list" tag="div">
    <el-row :gutter="20" key="row">
      <el-col :xs="24" :sm="12" :md="8" v-for="task in tasks" :key="task.id">
        <el-card class="task-card" @click="router.push(`/tasks/${task.id}`)">
          <div class="task-header">
            <el-tag type="info" size="small">{{ task.category_name }}</el-tag>
            <el-tag v-if="task.is_featured" type="danger" size="small" effect="dark">🔥 精华</el-tag>
            <el-tag v-if="task.status === 'pinned'" type="info" effect="plain" size="small">📌 固定</el-tag>
            <el-tag v-else-if="task.category_id !== 6" :type="statusTagMap[task.status]" effect="plain" size="small">{{ statusMap[task.status] }}</el-tag>
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
          <div class="task-custom" v-if="task.custom_data">
            <span v-for="(val, key) in parseCustomData(task.custom_data)" :key="key" class="custom-tag">
              {{ key }}：{{ val }}
            </span>
          </div>
          <div class="task-footer">
            <div class="task-meta">
              <el-avatar :size="20" :src="task.publisher_avatar || ''" />
              <span>{{ task.publisher_name }}</span>
            </div>
            <span class="reward" v-if="task.reward > 0">💰 {{ task.reward }}</span>
            <span class="reward-free" v-else-if="task.category_id !== 6">免费</span>
          </div>
        </el-card>
      </el-col>
    </el-row>
    </TransitionGroup>
    </div>

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
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
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
const sliderRef = ref(null)
const toolbarRef = ref(null)
const filters = reactive({ category_id: '', status: '', keyword: '', searchValues: {}, reward_min: null, reward_max: null })
const searchableFields = ref([])
const taskSectionRef = ref(null)

const subjectOptions = [
  '高等数学', '线性代数', '概率论', '大学物理', '大学英语',
  'Python', 'C语言', 'Java', '数据结构', '操作系统',
  '计算机网络', '数据库', '人工智能', '机器学习',
  '会计学', '经济学', '管理学', '法学', '医学', '其他',
]

let observer = null

const categoryIcons = {
  1: '🏃', 2: '📚', 3: '🤝', 4: '🛒', 5: '🔔', 6: '💬',
  7: '📌', 8: '📌', 9: '📌', 10: '📌',
}

function selectCategory(c) {
  filters.category_id = c.id
  onCategoryChange(c.id)
  nextTick(() => {
    if (taskSectionRef.value) {
      taskSectionRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

const hasActiveFilters = computed(() => {
  if (filters.keyword || filters.status) return true
  if (filters.reward_min !== null || filters.reward_max !== null) return true
  return Object.values(filters.searchValues).some(v => v)
})

function clearCategory() {
  filters.category_id = ''
  onCategoryChange('')
}

function clearAllFilters() {
  filters.keyword = ''
  filters.status = ''
  filters.searchValues = {}
  filters.reward_min = null
  filters.reward_max = null
  onSearch()
}

function scrollSlider(dir) {
  if (sliderRef.value) {
    sliderRef.value.scrollBy({ left: dir * 280, behavior: 'smooth' })
  }
}

const statusMap = { recruiting: '招募中', in_progress: '进行中', completed: '已完成', cancelled: '已取消', pinned: '固定帖子' }
const statusTagMap = { recruiting: 'primary', in_progress: 'warning', completed: 'success', cancelled: 'info', pinned: '' }

function parseCustomData(data) {
  if (!data) return {}
  try {
    const obj = typeof data === 'string' ? JSON.parse(data) : data
    // 过滤已有专属 UI 的字段
    const known = ['pickup_location', 'delivery_location', 'subject']
    const filtered = {}
    for (const [k, v] of Object.entries(obj)) {
      if (!known.includes(k) && v) filtered[k] = v
    }
    return filtered
  } catch { return {} }
}

async function loadCategories() {
  try { const res = await api.get('/categories'); categories.value = res.data.data }
  catch (err) { console.error('Load categories error:', err) }
}

function buildParams() {
  const params = { page: page.value, limit }
  if (filters.category_id) params.category_id = filters.category_id
  if (filters.status) params.status = filters.status
  if (filters.keyword) params.keyword = filters.keyword
  // 通过已知列传递常用搜索字段
  if (filters.searchValues.subject) params.subject = filters.searchValues.subject
  if (filters.searchValues.pickup_location) params.pickup_location = filters.searchValues.pickup_location
  if (filters.searchValues.delivery_location) params.delivery_location = filters.searchValues.delivery_location
  // 其他自定义字段通过 search_fields JSON 传递
  const custom = {}
  for (const [k, v] of Object.entries(filters.searchValues)) {
    if (v && !['subject', 'pickup_location', 'delivery_location'].includes(k)) custom[k] = v
  }
  if (Object.keys(custom).length > 0) params.search_fields = JSON.stringify(custom)
  if (filters.reward_min !== null && filters.reward_min !== undefined) params.reward_min = filters.reward_min
  if (filters.reward_max !== null && filters.reward_max !== undefined) params.reward_max = filters.reward_max
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

/** 切换分类时动态加载搜索字段 */
function onCategoryChange(val) {
  filters.searchValues = {}
  filters.reward_min = null
  filters.reward_max = null
  const cat = categories.value.find(c => c.id == val)
  if (cat && cat.template_config) {
    let tpl
    try { tpl = typeof cat.template_config === 'string' ? JSON.parse(cat.template_config) : cat.template_config }
    catch { tpl = [] }
    searchableFields.value = (Array.isArray(tpl) ? tpl : []).filter(f => f.searchable)
  } else {
    searchableFields.value = []
  }
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
/* 粘性搜索工具栏 */
.search-toolbar {
  position: sticky;
  top: 64px;
  z-index: 50;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 12px 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.toolbar-inner {
  max-width: 1200px;
  margin: 0 auto;
}
.search-row {
  display: flex;
  gap: 10px;
  align-items: center;
}
.search-row + .search-row { margin-top: 10px; }
.search-input { flex: 1; }
.search-input :deep(.el-input__wrapper) {
  border-radius: 12px !important;
  box-shadow: none !important;
}
.status-select { width: 130px; flex-shrink: 0; }
.status-select :deep(.el-input__wrapper) { border-radius: 12px !important; }
.search-btn {
  height: 48px;
  padding: 0 24px;
  border-radius: 12px !important;
  font-size: 15px !important;
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 8px;
}
.price-label { color: #909399; font-size: 14px; flex-shrink: 0; }
.price-sep { color: #c0c4cc; margin: 0 4px; }

/* 分类滑块 */
.category-slider {
  margin-bottom: 16px;
}
.slider-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}
.slider-arrow {
  flex-shrink: 0;
  width: 36px; height: 36px;
  border: 1px solid #e4e7ed;
  border-radius: 50%;
  background: #fff;
  color: #606266;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.slider-arrow:hover {
  border-color: #409eff;
  color: #409eff;
  background: #ecf5ff;
}
.category-cards {
  flex: 1;
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 4px 4px 8px;
  scrollbar-width: none;
}
.category-cards::-webkit-scrollbar { display: none; }
.category-card {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  background: #fff;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  user-select: none;
  white-space: nowrap;
}
.category-card:hover {
  border-color: #a0c4ff;
  background: #f5f9ff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.1);
}
.category-card.active {
  border-color: #409eff;
  background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
}
.category-icon {
  font-size: 24px;
  flex-shrink: 0;
}
.category-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

/* 任务列表过渡动画 */
.task-list-enter-active {
  transition: all 0.4s ease;
}
.task-list-leave-active {
  transition: all 0.2s ease;
}
.task-list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.task-list-leave-to {
  opacity: 0;
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

.task-custom { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.custom-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  color: #666;
  font-size: 11px;
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
