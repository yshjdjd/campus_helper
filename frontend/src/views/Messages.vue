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
.messages-page { max-width: 700px; margin: 0 auto; }
.messages-page h2 { margin-bottom: 20px; }
.empty { color: #999; text-align: center; padding: 40px; }
.conv-item { padding: 16px; border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.2s; }
.conv-item:hover { background: #f5f7fa; }
.conv-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
.task-title { font-weight: bold; color: #333; }
.time { color: #999; font-size: 13px; }
.conv-body { color: #666; font-size: 14px; }
.sender { margin-right: 4px; }
.last-msg { color: #999; }
</style>
