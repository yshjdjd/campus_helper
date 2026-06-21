<template>
  <div class="user-profile" v-if="userData">
    <el-card>
      <div class="profile-header">
        <el-avatar :size="80" :src="userData.avatar || ''" />
        <div class="profile-info">
          <h2>{{ userData.username }}</h2>
          <p class="meta">
            <el-tag :type="userData.role === 'student' ? 'primary' : userData.role === 'teacher' ? 'success' : 'warning'" size="small">
              {{ userData.role === 'student' ? '学生' : userData.role === 'teacher' ? '教师' : '管理员' }}
            </el-tag>
            <span>信用分：<el-tag :type="userData.credit_score >= 90 ? 'success' : userData.credit_score >= 70 ? 'warning' : 'danger'" size="small">{{ userData.credit_score }}</el-tag></span>
            <span>已完成任务：{{ userData.completedCount }}</span>
          </p>
        </div>
      </div>
    </el-card>

    <el-card style="margin-top:20px">
      <template #header><span>收到的评价</span></template>
      <div v-if="userData.reviews?.length === 0" class="empty">暂无评价</div>
      <div v-for="r in userData.reviews" :key="r.id" class="review-item">
        <div class="review-header">
          <span class="reviewer">{{ r.reviewer_name }}</span>
          <el-tag :type="ratingTagMap[r.rating]" size="small">{{ ratingLabelMap[r.rating] }}</el-tag>
          <span class="task-name" v-if="r.task_title">任务：{{ r.task_title }}</span>
        </div>
        <p v-if="r.comment" class="comment">{{ r.comment }}</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api'

const route = useRoute()
const userData = ref(null)

const ratingLabelMap = { good: '好评', neutral: '中评', bad: '差评' }
const ratingTagMap = { good: 'success', neutral: 'info', bad: 'danger' }

onMounted(async () => {
  try {
    const res = await api.get(`/users/${route.params.id}`)
    userData.value = res.data.data
  } catch (err) { console.error('Load user error:', err) }
})
</script>

<style scoped>
.user-profile { max-width: 700px; margin: 0 auto; }
.profile-header { display: flex; align-items: center; gap: 20px; }
.meta { display: flex; gap: 16px; align-items: center; margin-top: 8px; color: #666; font-size: 14px; }
.empty { color: #999; text-align: center; padding: 40px; }
.review-item { padding: 12px 0; border-bottom: 1px solid #eee; }
.review-header { display: flex; align-items: center; gap: 8px; }
.reviewer { font-weight: bold; }
.task-name { color: #999; font-size: 13px; margin-left: auto; }
.comment { color: #666; margin: 4px 0 0; }
</style>
