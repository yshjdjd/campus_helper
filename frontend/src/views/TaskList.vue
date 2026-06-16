<template>
  <div class="task-list">
    <div class="filters">
      <el-select v-model="filters.category" clearable placeholder="分类筛选" @change="loadTasks">
        <el-option label="跑腿" value="errand" />
        <el-option label="学业" value="study" />
        <el-option label="招募" value="recruit" />
        <el-option label="生活" value="life" />
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
            <el-tag :type="categoryTagMap[task.category]">{{ categoryMap[task.category] }}</el-tag>
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
const total = ref(0)
const page = ref(1)
const limit = 9
const filters = reactive({ category: '', status: '', keyword: '' })

const categoryMap = { errand: '跑腿', study: '学业', recruit: '招募', life: '生活' }
const statusMap = { recruiting: '招募中', in_progress: '进行中', completed: '已完成', cancelled: '已取消' }
const categoryTagMap = { errand: 'warning', study: 'success', recruit: 'primary', life: 'info' }
const statusTagMap = { recruiting: 'primary', in_progress: 'warning', completed: 'success', cancelled: 'info' }

async function loadTasks() {
  try {
    const params = { page: page.value, limit }
    if (filters.category) params.category = filters.category
    if (filters.status) params.status = filters.status
    if (filters.keyword) params.keyword = filters.keyword
    const res = await api.get('/tasks', { params })
    tasks.value = res.data.data.rows
    total.value = res.data.data.total
  } catch (err) {
    console.error('Load tasks error:', err)
  }
}

onMounted(loadTasks)
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
