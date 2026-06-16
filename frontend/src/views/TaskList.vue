<template>
  <div class="task-list">
    <div class="filters">
      <el-select v-model="filters.category_id" clearable placeholder="分类筛选" @change="loadTasks">
        <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
      <el-select v-model="filters.status" clearable placeholder="状态筛选" @change="loadTasks">
        <el-option label="招募中" value="recruiting" />
        <el-option label="进行中" value="in_progress" />
        <el-option label="已完成" value="completed" />
      </el-select>
      <el-input v-model="filters.keyword" placeholder="搜索关键词" clearable @keyup.enter="loadTasks" style="width:200px" />
      <el-button type="primary" @click="loadTasks">搜索</el-button>
    </div>

    <el-row :gutter="16">
      <el-col :span="8" v-for="task in tasks" :key="task.id">
        <el-card class="task-card" @click="router.push(`/tasks/${task.id}`)">
          <div class="task-header">
            <el-tag type="info">{{ task.category_name }}</el-tag>
            <el-tag :type="statusTagMap[task.status]" effect="plain">{{ statusMap[task.status] }}</el-tag>
          </div>
          <h3>{{ task.title }}</h3>
          <p class="desc">{{ task.description?.substring(0, 80) }}...</p>
          <div class="task-footer">
            <span>{{ task.publisher_name }}</span>
            <span class="reward" v-if="task.reward > 0">💰 {{ task.reward }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-pagination
      v-if="total > 0"
      :current-page="page" :page-size="limit" :total="total"
      layout="prev, pager, next" @current-change="p => { page = p; loadTasks() }"
      style="margin-top: 20px; justify-content: center;"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const tasks = ref([])
const categories = ref([])
const total = ref(0)
const page = ref(1)
const limit = 9
const filters = reactive({ category_id: '', status: '', keyword: '' })

const statusMap = { recruiting: '招募中', in_progress: '进行中', completed: '已完成', cancelled: '已取消' }
const statusTagMap = { recruiting: 'primary', in_progress: 'warning', completed: 'success', cancelled: 'info' }

async function loadCategories() {
  try { const res = await api.get('/categories'); categories.value = res.data.data }
  catch (err) { console.error('Load categories error:', err) }
}

async function loadTasks() {
  try {
    const params = { page: page.value, limit }
    if (filters.category_id) params.category_id = filters.category_id
    if (filters.status) params.status = filters.status
    if (filters.keyword) params.keyword = filters.keyword
    const res = await api.get('/tasks', { params })
    tasks.value = res.data.data.rows
    total.value = res.data.data.total
  } catch (err) { console.error('Load tasks error:', err) }
}

onMounted(() => { loadCategories(); loadTasks() })
</script>

<style scoped>
.filters { display: flex; gap: 12px; margin-bottom: 20px; }
.task-card { cursor: pointer; margin-bottom: 16px; transition: box-shadow 0.2s; }
.task-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.task-header { display: flex; gap: 8px; margin-bottom: 8px; }
.task-card h3 { margin: 0 0 8px; font-size: 16px; }
.desc { color: #666; font-size: 13px; margin: 0 0 8px; }
.task-footer { display: flex; justify-content: space-between; font-size: 13px; color: #999; }
.reward { color: #e6a23c; font-weight: bold; }
</style>
