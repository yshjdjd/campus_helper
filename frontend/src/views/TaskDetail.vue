<template>
  <div class="task-detail" v-if="task">
    <el-card>
      <div class="header">
        <div>
          <el-tag type="info">{{ task.category_name }}</el-tag>
          <el-tag :type="statusTagMap[task.status]" effect="plain" style="margin-left:8px">{{ statusMap[task.status] }}</el-tag>
        </div>
        <span class="time">发布时间：{{ formatDate(task.created_at) }}</span>
      </div>
      <h2>{{ task.title }}</h2>
      <p class="desc">{{ task.description }}</p>
      <div class="info">
        <span class="user-link" @click="router.push(`/users/${task.publisher_id}`)">
          <el-avatar :size="24" :src="task.publisher_avatar || ''" />
          发布者：{{ task.publisher_name }}
        </span>
        <span v-if="task.reward > 0">赏金：💰 {{ task.reward }}</span>
        <span v-if="task.location">📍 {{ task.location }}</span>
        <span v-if="task.deadline">⏰ 截止：{{ formatDate(task.deadline) }}</span>
        <span>接单人数：{{ acceptors.length }}{{ task.max_acceptors ? ` / ${task.max_acceptors}` : '（不限）' }}</span>
      </div>

      <!-- 接单者列表 -->
      <div v-if="acceptors.length > 0" class="acceptors-section">
        <h4>接单者</h4>
        <div v-for="a in acceptors" :key="a.user_id" class="acceptor-item">
          <span class="user-link" @click="router.push(`/users/${a.user_id}`)">
            <el-avatar :size="20" :src="a.avatar || ''" />
            {{ a.username }}
          </span>
          <el-tag v-if="task.status === 'in_progress' || task.status === 'completed'" :type="a.confirmed ? 'success' : 'info'" size="small">
            {{ a.confirmed ? '已确认 ✓' : '未确认' }}
          </el-tag>
        </div>
      </div>

      <!-- 发布者确认状态 -->
      <div v-if="task.status === 'in_progress' && isParticipant" class="confirm-status">
        <el-tag :type="task.publisher_confirmed ? 'success' : 'info'" effect="plain">
          发布者 {{ task.publisher_confirmed ? '已确认 ✓' : '未确认' }}
        </el-tag>
      </div>

      <!-- 操作按钮 -->
      <div class="actions" v-if="authStore.isLoggedIn">
        <el-button v-if="canAccept" type="primary" @click="handleAccept">
          接单{{ task.max_acceptors ? ` (${acceptors.length}/${task.max_acceptors})` : '' }}
        </el-button>
        <el-button v-if="task.status === 'in_progress' && isParticipant && !hasConfirmed" type="success" @click="handleConfirm">确认完成</el-button>
        <el-button v-if="task.status === 'in_progress' && isAcceptor" type="warning" @click="handleAbandon">放弃</el-button>
        <el-button v-if="(task.status === 'recruiting' || task.status === 'in_progress') && task.publisher_id === authStore.user?.id" type="danger" @click="handleCancel">取消任务</el-button>
      </div>
    </el-card>

    <!-- 评价区域（任务完成后显示） -->
    <el-card v-if="task.status === 'completed' && isParticipant" style="margin-top:20px">
      <template #header><span>任务评价</span></template>
      <div v-if="myReview">
        <p>您已评价：<el-tag :type="ratingTagMap[myReview.rating]">{{ ratingLabelMap[myReview.rating] }}</el-tag></p>
        <p v-if="myReview.comment" style="color:#666;margin-top:4px">{{ myReview.comment }}</p>
      </div>
      <div v-else>
        <p style="margin-bottom:12px">请对这次任务体验进行评价：</p>
        <div class="rating-buttons">
          <el-button :type="selectedRating === 'good' ? 'success' : 'default'" @click="selectedRating = 'good'">👍 好</el-button>
          <el-button :type="selectedRating === 'neutral' ? 'info' : 'default'" @click="selectedRating = 'neutral'">😐 中</el-button>
          <el-button :type="selectedRating === 'bad' ? 'danger' : 'default'" @click="selectedRating = 'bad'">👎 差</el-button>
        </div>
        <el-input v-model="reviewComment" type="textarea" :rows="2" placeholder="可选：填写评价内容" style="margin-top:12px" />
        <el-button type="primary" :disabled="!selectedRating" :loading="reviewLoading" @click="submitReview" style="margin-top:12px">提交评价</el-button>
      </div>

      <!-- 对方评价 -->
      <div v-if="taskReviews.length > 0" style="margin-top:20px;border-top:1px solid #eee;padding-top:16px">
        <h4>评价记录</h4>
        <div v-for="r in taskReviews" :key="r.id" class="review-item">
          <span class="reviewer">{{ r.reviewer_name }}</span>
          <el-tag :type="ratingTagMap[r.rating]" size="small">{{ ratingLabelMap[r.rating] }}</el-tag>
          <span v-if="r.comment" class="comment">{{ r.comment }}</span>
        </div>
      </div>
    </el-card>

    <!-- 私信区域 -->
    <el-card class="chat-card" v-if="authStore.isLoggedIn && isParticipant">
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api'
import { io } from 'socket.io-client'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const task = ref(null)
const acceptors = ref([])
const messages = ref([])
const newMessage = ref('')
const messagesRef = ref(null)
const taskReviews = ref([])
const myReview = ref(null)
const selectedRating = ref('')
const reviewComment = ref('')
const reviewLoading = ref(false)
let socket = null

const statusMap = { recruiting: '招募中', in_progress: '进行中', completed: '已完成', cancelled: '已取消' }
const statusTagMap = { recruiting: 'primary', in_progress: 'warning', completed: 'success', cancelled: 'info' }
const ratingLabelMap = { good: '好评', neutral: '中评', bad: '差评' }
const ratingTagMap = { good: 'success', neutral: 'info', bad: 'danger' }

const isAcceptor = computed(() => {
  if (!task.value || !authStore.user) return false
  return acceptors.value.some(a => a.user_id === authStore.user.id)
})

const isParticipant = computed(() => {
  if (!task.value || !authStore.user) return false
  return task.value.publisher_id === authStore.user.id || isAcceptor.value
})

const hasConfirmed = computed(() => {
  if (!task.value || !authStore.user) return false
  if (task.value.publisher_id === authStore.user.id) return task.value.publisher_confirmed
  // 接单者：检查 task_acceptors 中自己的 confirmed 状态
  const myRecord = acceptors.value.find(a => a.user_id === authStore.user.id)
  return myRecord ? !!myRecord.confirmed : false
})

const canAccept = computed(() => {
  if (!task.value || !authStore.user) return false
  if (task.value.publisher_id === authStore.user.id) return false
  if (task.value.status !== 'recruiting' && task.value.status !== 'in_progress') return false
  if (isAcceptor.value) return false
  if (task.value.max_acceptors && acceptors.value.length >= task.value.max_acceptors) return false
  return true
})

function formatDate(d) { return d ? new Date(d).toLocaleString('zh-CN') : '' }
function scrollToBottom() { const el = messagesRef.value; if (el) el.scrollTop = el.scrollHeight }

async function loadTask() {
  const res = await api.get(`/tasks/${route.params.id}`)
  task.value = res.data.data
  acceptors.value = res.data.data.acceptors || []
}

async function loadMessages() {
  if (!authStore.isLoggedIn) return
  try {
    const res = await api.get('/messages', { params: { taskId: route.params.id } })
    messages.value = res.data.data
    await nextTick(); scrollToBottom()
  } catch (e) { /* ignore */ }
}

async function loadReviews() {
  try {
    const res = await api.get(`/reviews/task/${route.params.id}`)
    taskReviews.value = res.data.data
    myReview.value = taskReviews.value.find(r => r.reviewer_id === authStore.user?.id) || null
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
  // 发送给对方：若自己是发布者，发给第一个接单者；否则发给发布者
  let receiverId
  if (task.value.publisher_id === authStore.user?.id) {
    receiverId = acceptors.value.length > 0 ? acceptors.value[0].user_id : task.value.acceptor_id
  } else {
    receiverId = task.value.publisher_id
  }
  socket.emit('send_message', { taskId: task.value.id, receiverId, content: newMessage.value.trim() })
  messages.value.push({ id: Date.now(), task_id: task.value.id, sender_id: authStore.user.id, content: newMessage.value.trim(), created_at: new Date().toISOString() })
  newMessage.value = ''
  nextTick(scrollToBottom)
}

async function handleAccept() {
  try { await api.put(`/tasks/${task.value.id}/accept`); ElMessage.success('接单成功'); loadTask() }
  catch (err) { ElMessage.error(err.response?.data?.message || '操作失败') }
}

async function handleConfirm() {
  try {
    const res = await api.put(`/tasks/${task.value.id}/confirm`)
    ElMessage.success(res.data.message)
    loadTask()
    if (res.data.data.bothConfirmed) loadReviews()
  } catch (err) { ElMessage.error(err.response?.data?.message || '操作失败') }
}

async function handleCancel() {
  try { await api.put(`/tasks/${task.value.id}/cancel`); ElMessage.success('任务已取消'); loadTask() }
  catch (err) { ElMessage.error(err.response?.data?.message || '操作失败') }
}

async function handleAbandon() {
  try { await api.put(`/tasks/${task.value.id}/abandon`); ElMessage.success('已放弃'); loadTask() }
  catch (err) { ElMessage.error(err.response?.data?.message || '操作失败') }
}

async function submitReview() {
  if (!selectedRating.value) return
  reviewLoading.value = true
  try {
    const revieweeId = task.value.publisher_id === authStore.user.id ? task.value.acceptor_id : task.value.publisher_id
    await api.post('/reviews', {
      task_id: task.value.id,
      reviewee_id: revieweeId,
      rating: selectedRating.value,
      comment: reviewComment.value || undefined,
    })
    ElMessage.success('评价成功')
    loadReviews()
  } catch (err) { ElMessage.error(err.response?.data?.message || '评价失败') }
  finally { reviewLoading.value = false }
}

onMounted(() => {
  loadTask(); loadMessages(); initSocket()
  // 如果任务已完成，加载评价
  setTimeout(() => { if (task.value?.status === 'completed') loadReviews() }, 500)
})
</script>

<style scoped>
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.time { color: #999; font-size: 13px; }
.desc { color: #333; line-height: 1.6; margin: 12px 0; }
.info { display: flex; gap: 20px; color: #666; font-size: 14px; flex-wrap: wrap; margin-bottom: 16px; }
.user-link { display: flex; align-items: center; gap: 6px; cursor: pointer; color: #409eff; }
.user-link:hover { text-decoration: underline; }
.confirm-status { margin-bottom: 16px; }
.acceptors-section { margin-bottom: 16px; }
.acceptors-section h4 { margin: 0 0 8px; font-size: 14px; color: #333; }
.acceptor-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
.actions { margin-top: 16px; }
.chat-card { margin-top: 20px; }
.messages { max-height: 300px; overflow-y: auto; padding: 8px; }
.msg { margin-bottom: 8px; }
.msg.mine { text-align: right; }
.sender { font-size: 12px; color: #999; }
.bubble { display: inline-block; padding: 8px 12px; border-radius: 8px; background: #f0f0f0; max-width: 70%; }
.msg.mine .bubble { background: #409eff; color: #fff; }
.input-bar { display: flex; gap: 8px; margin-top: 12px; }
.rating-buttons { display: flex; gap: 12px; }
.review-item { padding: 8px 0; display: flex; align-items: center; gap: 8px; }
.reviewer { font-weight: bold; }
.comment { color: #666; }
</style>
