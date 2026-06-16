<template>
  <div class="auth-page">
    <el-card class="auth-card">
      <h2>注册</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
        <el-form-item label="学号/工号" prop="student_id">
          <el-input v-model="form.student_id" placeholder="请输入学号" />
        </el-form-item>
        <el-form-item label="昵称" prop="username">
          <el-input v-model="form.username" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="校园邮箱" prop="school_email">
          <el-input v-model="form.school_email" placeholder="xxx@your-school.edu.cn" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="至少6位" />
        </el-form-item>
        <el-form-item label="身份" prop="role">
          <el-radio-group v-model="form.role">
            <el-radio value="student">学生</el-radio>
            <el-radio value="teacher">教师</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleRegister" style="width:100%">注册</el-button>
        </el-form-item>
      </el-form>
      <div class="link">已有账号？<router-link to="/login">去登录</router-link></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref()
const loading = ref(false)
const form = reactive({
  student_id: '', username: '', school_email: '', password: '', role: 'student',
})
const rules = {
  student_id: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  username: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  school_email: [{ required: true, type: 'email', message: '请输入有效邮箱', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: '密码至少6位', trigger: 'blur' }],
  role: [{ required: true, message: '请选择身份', trigger: 'change' }],
}

async function handleRegister() {
  await formRef.value.validate()
  loading.value = true
  try {
    await authStore.register(form)
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page { display: flex; justify-content: center; align-items: center; min-height: 80vh; }
.auth-card { width: 400px; }
.auth-card h2 { text-align: center; margin-bottom: 20px; }
.link { text-align: center; margin-top: 10px; font-size: 14px; color: #666; }
</style>
