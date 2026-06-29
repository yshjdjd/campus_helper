<template>
  <div class="profile" v-if="user">
    <el-card>
      <div class="profile-header">
        <el-upload
          class="avatar-uploader"
          :action="uploadUrl"
          :headers="uploadHeaders"
          :show-file-list="false"
          :on-success="handleAvatarSuccess"
          :before-upload="beforeAvatarUpload"
        >
          <el-avatar :size="80" :src="user.avatar || '/default-avatar.svg'" />
          <div class="avatar-overlay">更换头像</div>
        </el-upload>
        <div class="profile-info">
          <template v-if="!editing">
            <h2>{{ user.username }}</h2>
            <el-button size="small" @click="startEdit">编辑资料</el-button>
          </template>
          <template v-else>
            <el-input v-model="editForm.username" style="width:200px" />
            <div style="margin-top:8px">
              <el-button type="primary" size="small" @click="saveEdit">保存</el-button>
              <el-button size="small" @click="editing = false">取消</el-button>
            </div>
          </template>
        </div>
      </div>

      <el-descriptions :column="2" border style="margin-top:20px">
        <el-descriptions-item label="学号">{{ user.student_id }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ user.school_email }}</el-descriptions-item>
        <el-descriptions-item label="身份">{{ user.role === 'student' ? '学生' : user.role === 'teacher' ? '教师' : '管理员' }}</el-descriptions-item>
        <el-descriptions-item label="信用分">
          <el-tag :type="user.credit_score >= 90 ? 'success' : user.credit_score >= 70 ? 'warning' : 'danger'">
            {{ user.credit_score }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ formatDate(user.created_at) }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-tabs v-model="activeTab" style="margin-top:20px">
      <el-tab-pane label="收到的评价" name="reviews">
        <div v-if="reviews.length === 0" class="empty">暂无评价</div>
        <div v-for="r in reviews" :key="r.id" class="review-item">
          <div class="review-header">
            <span class="reviewer">{{ r.reviewer_name }}</span>
            <el-tag :type="ratingTagMap[r.rating]" size="small">{{ ratingLabelMap[r.rating] }}</el-tag>
            <span class="task-name" v-if="r.task_title">任务：{{ r.task_title }}</span>
          </div>
          <p v-if="r.comment" class="comment">{{ r.comment }}</p>
        </div>
      </el-tab-pane>

      <el-tab-pane label="完成的任务" name="completed">
        <div v-if="completedTasks.length === 0" class="empty">暂无完成的任务</div>
        <div v-for="task in completedTasks" :key="task.id" class="completed-item" @click="router.push(`/tasks/${task.id}`)">
          <div class="task-header">
            <span class="title">{{ task.title }}</span>
            <el-tag type="success" effect="plain">已完成</el-tag>
          </div>
          <div class="task-meta">
            <span>{{ task.category_name }}</span>
            <span>角色：{{ task.publisher_id === user.id ? '发布者' : '接单者' }}</span>
            <span>对方：{{ task.publisher_id === user.id ? task.acceptor_name : task.publisher_name }}</span>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const user = ref(null)
const reviews = ref([])
const completedTasks = ref([])
const activeTab = ref('reviews')
const editing = ref(false)
const editForm = reactive({ username: '' })

const uploadUrl = '/api/auth/avatar'
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${authStore.token}`,
}))

const ratingLabelMap = { good: '好评', neutral: '中评', bad: '差评' }
const ratingTagMap = { good: 'success', neutral: 'info', bad: 'danger' }

function formatDate(d) { return d ? new Date(d).toLocaleString('zh-CN') : '' }

function startEdit() {
  editForm.username = user.value.username
  editing.value = true
}

async function saveEdit() {
  try {
    const res = await api.put('/auth/profile', { username: editForm.username })
    user.value = res.data.data
    authStore.user.username = res.data.data.username
    localStorage.setItem('user', JSON.stringify(authStore.user))
    editing.value = false
    ElMessage.success('更新成功')
  } catch (err) { ElMessage.error(err.response?.data?.message || '更新失败') }
}

function handleAvatarSuccess(res) {
  user.value.avatar = res.data.avatar
  authStore.user.avatar = res.data.avatar
  localStorage.setItem('user', JSON.stringify(authStore.user))
  ElMessage.success('头像更新成功')
}

function beforeAvatarUpload(file) {
  if (!file.type.startsWith('image/')) { ElMessage.error('只能上传图片'); return false }
  if (file.size > 2 * 1024 * 1024) { ElMessage.error('图片不能超过2MB'); return false }
  return true
}

onMounted(async () => {
  try {
    const res = await authStore.fetchProfile()
    user.value = res.data
    const rv = await api.get(`/reviews/user/${user.value.id}`)
    reviews.value = rv.data.data
    const ct = await api.get(`/tasks/completed/${user.value.id}`)
    completedTasks.value = ct.data.data
  } catch (err) { console.error('Profile error:', err) }
})
</script>

<style scoped>
.profile { max-width: 700px; margin: 0 auto; }
.profile-header { display: flex; align-items: center; gap: 20px; }
.avatar-uploader { position: relative; cursor: pointer; }
.avatar-uploader:hover .avatar-overlay { opacity: 1; }
.avatar-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: rgba(0,0,0,0.5); color: #fff; font-size: 12px;
  text-align: center; padding: 2px; border-radius: 0 0 50% 50%;
  opacity: 0; transition: opacity 0.2s;
}
.empty { color: #999; text-align: center; padding: 40px; }
.review-item { padding: 12px 0; border-bottom: 1px solid #eee; }
.review-header { display: flex; align-items: center; gap: 8px; }
.reviewer { font-weight: bold; }
.task-name { color: #999; font-size: 13px; margin-left: auto; }
.comment { color: #666; margin: 4px 0 0; }
.completed-item { padding: 16px; border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.2s; }
.completed-item:hover { background: #f5f7fa; }
.task-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.title { font-weight: bold; }
.task-meta { display: flex; gap: 16px; color: #666; font-size: 13px; }
</style>
