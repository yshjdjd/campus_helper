<template>
  <div class="task-detail" v-if="task">
    <el-card>
      <div class="header">
        <div>
          <el-tag :type="categoryTagMap[task.category]">{{ categoryMap[task.category] }}</el-tag>
          <el-tag :type="statusTagMap[task.status]" effect="plain" style="margin-left:8px">{{ statusMap[task.status] }}</el-tag>
        </div>
        <span class="time">发布时间：{{ formatDate(task.created_at) }}</span>
      </div>
      <h2>{{ task.title }}</h2>
      <p class="desc">{{ task.description }}</p>
      <div class="info">
        <span>发布者：{{ task.publisher_name }}</span>
        <span v-if="task.acceptor_name">接单者：{{ task.acceptor_name }}</span>
        <span v-if="task.reward > 0">赏金：💰 {{ task.reward }}</span>
        <span v-if="task.location">📍 {{ task.location }}</span>
        <span v-if="task.deadline">⏰ 截止：{{ formatDate(task.deadline) }}</span>
      </div>

      <div class="actions" v-if="authStore.isLoggedIn">
        <el-button v-if="task.status === 'recruiting' && task.publisher_id !== authStore.user?.id" type="primary" @click="handleAccept">接单</el-button>
        <el-button v-if="task.status === 'in_progress' && task.publisher_id === authStore.user?.id" type="success" @click="handleComplete">确认完成</el-button>
        <el-button v-if="(task.status === 'recruiting' || task.status === 'in_progress') && (task.publisher_id === authStore.user?.id || task.acceptor_id === authStore.user?.id)" type="danger" @click="handleCancel">取消任务</el-button>
      </div>
    </el-card>

    <el-card class="chat-card" v-if="authStore.isLoggedIn && (task.publisher_id === authStore.user?.id || task.acceptor_id === authStore.user?.id)">
      <template #header><span>任务私信</span></template>
      <div class="messages" ref="messagesRef">
        <div v-for="msg in messages" :key="msg.id" :class="['msg', msg.sender_id === authStore.user?.id ? 'mine' : 'other']">
          <span class="sender">{{ msg.sender_name }}</span>
          <div class="bubble">{{ msg.content }}</div>
        </div>
      </div>
      <div class="input-bar">
        <el-input v-model="newMessage" placeholder="输入消息..." @keyup.enter="sendMessage" />
        <el-button type="primary" @click="sendMessage" :disabled="!newMessage.trim()">发送</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api'
import { io } from 'socket.io-client'
import { ElMessage } from 'element-plus'

const route = useRoute()
const authStore = useAuthStore()
const task = ref(null)
const messages = ref([])
const newMessage = ref('')
const messagesRef = ref(null)
let socket = null

const categoryMap = { errand: '跑腿', study: '学业', recruit: '招募', life: '生活' }
const statusMap = { recruiting: '招募中', in_progress: '进行中', completed: '已完成', cancelled: '已取消' }
const categoryTagMap = { errand: 'warning', study: 'success', recruit: 'primary', life: 'info' }
const statusTagMap = { recruiting: 'primary', in_progress: 'warning', completed: 'success', cancelled: 'info' }

function formatDate(d) { return d ? new Date(d).toLocaleString('zh-CN') : '' }
function scrollToBottom() { const el = messagesRef.value; if (el) el.scrollTop = el.scrollHeight }

async function loadTask() {
  const res = await api.get(`/tasks/${route.params.id}`)
  task.value = res.data.data
}

async function loadMessages() {
  if (!authStore.isLoggedIn) return
  try {
    const res = await api.get('/messages', { params: { taskId: route.params.id } })
    messages.value = res.data.data
    await nextTick(); scrollToBottom()
  } catch (e) { /* ignore */ }
}

function initSocket() {
  if (!authStore.isLoggedIn) return
  socket = io('/', { auth: { token: authStore.token } })
  socket.on('new_message', (msg) => {
    if (msg.task_id == route.params.id) {
      messages.value.push(msg)
      nextTick(scrollToBottom)
    }
  })
}

function sendMessage() {
  if (!newMessage.value.trim() || !task.value) return
  const receiverId = task.value.publisher_id === authStore.user?.id ? task.value.acceptor_id : task.value.publisher_id
  socket.emit('send_message', { taskId: task.value.id, receiverId, content: newMessage.value.trim() })
  messages.value.push({ id: Date.now(), task_id: task.value.id, sender_id: authStore.user.id, content: newMessage.value.trim(), created_at: new Date().toISOString() })
  newMessage.value = ''
  nextTick(scrollToBottom)
}

async function handleAccept() {
  try { await api.put(`/tasks/${task.value.id}/accept`); ElMessage.success('接单成功'); loadTask() }
  catch (err) { ElMessage.error(err.response?.data?.message || '操作失败') }
}
async function handleComplete() {
  try { await api.put(`/tasks/${task.value.id}/complete`); ElMessage.success('任务已完成'); loadTask() }
  catch (err) { ElMessage.error(err.response?.data?.message || '操作失败') }
}
async function handleCancel() {
  try { await api.put(`/tasks/${task.value.id}/cancel`); ElMessage.success('任务已取消'); loadTask() }
  catch (err) { ElMessage.error(err.response?.data?.message || '操作失败') }
}

onMounted(() => { loadTask(); loadMessages(); initSocket() })
</script>

<style scoped>
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.time { color: #999; font-size: 13px; }
.desc { color: #333; line-height: 1.6; margin: 12px 0; }
.info { display: flex; gap: 20px; color: #666; font-size: 14px; flex-wrap: wrap; margin-bottom: 16px; }
.actions { margin-top: 16px; }
.chat-card { margin-top: 20px; }
.messages { max-height: 300px; overflow-y: auto; padding: 8px; }
.msg { margin-bottom: 8px; }
.msg.mine { text-align: right; }
.sender { font-size: 12px; color: #999; }
.bubble { display: inline-block; padding: 8px 12px; border-radius: 8px; background: #f0f0f0; max-width: 70%; }
.msg.mine .bubble { background: #409eff; color: #fff; }
.input-bar { display: flex; gap: 8px; margin-top: 12px; }
</style>
