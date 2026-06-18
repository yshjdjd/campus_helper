<template>
  <div class="messages-page">
    <h2>我的消息</h2>
    <div v-if="conversations.length === 0" class="empty">暂无消息</div>
    <div v-for="conv in conversations" :key="conv.task_id" class="conv-item" @click="router.push(`/tasks/${conv.task_id}`)">
      <div class="conv-header">
        <span class="task-title">{{ conv.task_title }}</span>
        <span class="time">{{ formatDate(conv.last_time) }}</span>
      </div>
      <div class="conv-body">
        <span class="sender">{{ conv.sender_name }}:</span>
        <span class="last-msg">{{ conv.last_message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const conversations = ref([])

function formatDate(d) { return d ? new Date(d).toLocaleString('zh-CN') : '' }

onMounted(async () => {
  try {
    const res = await api.get('/messages/conversations')
    conversations.value = res.data.data
  } catch (err) { console.error('Load conversations error:', err) }
})
</script>

<style scoped>
.messages-page { max-width: 750px; margin: 0 auto; }
.messages-page h2 { margin-bottom: 20px; font-size: 22px; color: #303133; }
.empty { color: #999; text-align: center; padding: 40px; }
.conv-item {
  padding: 16px 20px;
  margin-bottom: 10px;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s ease;
  background: #fff;
}
.conv-item:hover {
  background: #f0f5ff;
  border-color: #b3d8ff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.12);
  transform: translateY(-1px);
}
.conv-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
.task-title { font-weight: 600; color: #303133; }
.time { color: #999; font-size: 13px; }
.conv-body { color: #666; font-size: 14px; }
.sender { margin-right: 4px; font-weight: 500; }
.last-msg { color: #999; }
</style>
