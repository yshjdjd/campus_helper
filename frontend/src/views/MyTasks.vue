<template>
  <div class="my-tasks">
    <h2>我的任务</h2>
    <el-tabs v-model="activeTab" @tab-change="loadTasks">
      <el-tab-pane label="我发布的" name="published">
        <div v-if="published.length === 0" class="empty">暂无任务</div>
        <div v-for="task in published" :key="task.id" class="task-item" @click="router.push(`/tasks/${task.id}`)">
          <div class="task-header">
            <span class="title">{{ task.title }}</span>
            <el-tag :type="statusTagMap[task.status]" effect="plain">{{ statusMap[task.status] }}</el-tag>
          </div>
          <div class="task-footer">
            <span>{{ task.category_name }}</span>
            <span v-if="task.reward > 0">💰 {{ task.reward }}</span>
            <el-button v-if="task.status === 'recruiting' || task.status === 'in_progress'" size="small" type="danger" @click.stop="handleCancel(task)">取消</el-button>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="我接取的" name="accepted">
        <div v-if="accepted.length === 0" class="empty">暂无任务</div>
        <div v-for="task in accepted" :key="task.id" class="task-item" @click="router.push(`/tasks/${task.id}`)">
          <div class="task-header">
            <span class="title">{{ task.title }}</span>
            <el-tag :type="statusTagMap[task.status]" effect="plain">{{ statusMap[task.status] }}</el-tag>
          </div>
          <div class="task-footer">
            <span>发布者：{{ task.publisher_name }}</span>
            <span>{{ task.category_name }}</span>
            <el-button v-if="task.status === 'in_progress'" size="small" type="warning" @click.stop="handleAbandon(task)">放弃</el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const activeTab = ref('published')
const published = ref([])
const accepted = ref([])

const statusMap = { recruiting: '招募中', in_progress: '进行中', completed: '已完成', cancelled: '已取消' }
const statusTagMap = { recruiting: 'primary', in_progress: 'warning', completed: 'success', cancelled: 'info' }

async function loadTasks() {
  try {
    if (activeTab.value === 'published') {
      const res = await api.get('/tasks/my/published')
      published.value = res.data.data.rows
    } else {
      const res = await api.get('/tasks/my/accepted')
      accepted.value = res.data.data.rows
    }
  } catch (err) { console.error('Load my tasks error:', err) }
}

async function handleCancel(task) {
  try { await api.put(`/tasks/${task.id}/cancel`); ElMessage.success('已取消'); loadTasks() }
  catch (err) { ElMessage.error(err.response?.data?.message || '操作失败') }
}

async function handleAbandon(task) {
  try { await api.put(`/tasks/${task.id}/abandon`); ElMessage.success('已放弃'); loadTasks() }
  catch (err) { ElMessage.error(err.response?.data?.message || '操作失败') }
}

onMounted(loadTasks)
</script>

<style scoped>
.my-tasks { max-width: 700px; margin: 0 auto; }
.my-tasks h2 { margin-bottom: 20px; }
.empty { color: #999; text-align: center; padding: 40px; }
.task-item { padding: 16px; border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.2s; }
.task-item:hover { background: #f5f7fa; }
.task-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.title { font-weight: bold; }
.task-footer { display: flex; gap: 16px; align-items: center; color: #666; font-size: 13px; }
</style>
