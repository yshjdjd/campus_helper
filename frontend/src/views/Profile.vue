<template>
  <div class="profile" v-if="user">
    <el-card>
      <h2>个人中心</h2>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="学号">{{ user.student_id }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ user.username }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ user.school_email }}</el-descriptions-item>
        <el-descriptions-item label="身份">{{ user.role === 'student' ? '学生' : '教师' }}</el-descriptions-item>
        <el-descriptions-item label="信用分">
          <el-tag :type="user.credit_score >= 90 ? 'success' : user.credit_score >= 70 ? 'warning' : 'danger'">
            {{ user.credit_score }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ formatDate(user.created_at) }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card style="margin-top: 20px">
      <template #header><span>我的评价</span></template>
      <div v-if="reviews.length === 0" style="color:#999">暂无评价</div>
      <div v-for="r in reviews" :key="r.id" class="review-item">
        <el-rate :model-value="r.rating" disabled />
        <span class="reviewer">{{ r.reviewer_name }}</span>
        <span class="comment">{{ r.comment }}</span>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import api from '../api'

const authStore = useAuthStore()
const user = ref(null)
const reviews = ref([])

function formatDate(d) { return d ? new Date(d).toLocaleString('zh-CN') : '' }

onMounted(async () => {
  try {
    const res = await authStore.fetchProfile()
    user.value = res.data
    const rv = await api.get(`/reviews/user/${user.value.id}`)
    reviews.value = rv.data.data
  } catch (err) { console.error('Profile error:', err) }
})
</script>

<style scoped>
.profile { max-width: 700px; margin: 0 auto; }
.review-item { padding: 12px 0; border-bottom: 1px solid #eee; }
.reviewer { margin-left: 12px; color: #666; font-size: 13px; }
.comment { margin-left: 12px; }
</style>
