<template>
  <div class="auth-page">
    <div class="stars"></div>
    <div class="stars stars2"></div>
    <div class="stars stars3"></div>
    <div class="shooting-star"></div>

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
/* ====== 星空背景容器 ====== */
.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
  overflow: hidden;
  position: relative;
}

.stars {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 1px; height: 1px;
  background: transparent;
  box-shadow:
    20px 30px #fff, 70px 15px #fff, 150px 80px #fff, 200px 40px #fff, 280px 120px #fff,
    350px 25px #fff, 410px 60px #fff, 500px 90px #fff, 560px 35px #fff, 630px 100px #fff,
    720px 45px #fff, 780px 85px #fff, 850px 20px #fff, 920px 70px #fff, 1000px 50px #fff,
    40px 150px #fff, 100px 200px #fff, 180px 130px #fff, 260px 180px #fff, 330px 140px #fff,
    400px 210px #fff, 480px 160px #fff, 550px 220px #fff, 620px 170px #fff, 700px 200px #fff,
    760px 150px #fff, 840px 230px #fff, 910px 190px #fff, 980px 140px #fff,
    15px 280px #fff, 90px 250px #fff, 170px 300px #fff, 240px 270px #fff, 320px 310px #fff,
    390px 280px #fff, 460px 320px #fff, 530px 290px #fff, 610px 310px #fff, 680px 270px #fff,
    750px 330px #fff, 830px 280px #fff, 900px 320px #fff, 970px 290px #fff,
    30px 380px #fff, 110px 350px #fff, 190px 400px #fff, 270px 370px #fff, 350px 410px #fff,
    430px 380px #fff, 510px 400px #fff, 580px 370px #fff, 660px 410px #fff, 740px 380px #fff,
    810px 400px #fff, 890px 370px #fff, 960px 410px #fff,
    55px 450px #fff, 140px 430px #fff, 220px 460px #fff, 300px 440px #fff, 380px 470px #fff,
    450px 450px #fff, 520px 460px #fff, 600px 440px #fff, 670px 470px #fff, 760px 450px #fff,
    25px 520px #fff, 120px 500px #fff, 200px 530px #fff, 290px 510px #fff, 370px 530px #fff;
  animation: twinkle 3s ease-in-out infinite;
}
.stars2 {
  width: 2px; height: 2px;
  box-shadow:
    80px 50px #fff, 180px 100px #fff, 310px 30px #fff, 450px 70px #fff, 580px 40px #fff,
    700px 110px #fff, 830px 55px #fff, 960px 80px #fff,
    50px 180px #fff, 200px 220px #fff, 360px 160px #fff, 520px 200px #fff, 670px 180px #fff,
    810px 210px #fff, 940px 170px #fff,
    120px 300px #fff, 290px 340px #fff, 440px 290px #fff, 590px 330px #fff, 740px 310px #fff,
    880px 350px #fff,
    70px 400px #fff, 250px 420px #fff, 410px 390px #fff, 560px 430px #fff, 710px 400px #fff,
    870px 420px #fff,
    160px 500px #fff, 340px 480px #fff, 500px 510px #fff, 650px 490px #fff, 800px 520px #fff;
  animation: twinkle 4s ease-in-out 1s infinite;
}
.stars3 {
  width: 3px; height: 3px;
  box-shadow:
    120px 70px #c8e6ff, 350px 120px #e8f0ff, 600px 50px #c8e6ff, 880px 90px #e8f0ff,
    250px 250px #c8e6ff, 550px 240px #e8f0ff, 800px 260px #c8e6ff,
    100px 380px #e8f0ff, 420px 370px #c8e6ff, 700px 390px #e8f0ff, 930px 360px #c8e6ff,
    300px 470px #e8f0ff, 650px 480px #c8e6ff;
  animation: twinkle 5s ease-in-out 2s infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.shooting-star {
  position: absolute;
  top: 10%; left: 80%;
  width: 2px; height: 2px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 6px 2px rgba(255, 255, 255, 0.6);
  animation: shoot 6s linear infinite;
}
.shooting-star::after {
  content: '';
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 0;
  width: 80px;
  height: 1px;
  background: linear-gradient(to left, rgba(255,255,255,0.3), transparent);
}
@keyframes shoot {
  0% { transform: translateX(0) translateY(0); opacity: 0; }
  5% { opacity: 1; }
  15% { transform: translateX(-400px) translateY(300px); opacity: 0; }
  100% { transform: translateX(-400px) translateY(300px); opacity: 0; }
}

/* ====== 注册卡片 ====== */
.auth-card {
  width: 420px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.3), 0 0 80px rgba(100, 150, 255, 0.1) !important;
  z-index: 1;
}
.auth-card h2 { text-align: center; margin-bottom: 24px; font-size: 24px; color: #303133; }
.link { text-align: center; margin-top: 12px; font-size: 14px; color: #909399; }
.link a { color: #409eff; text-decoration: none; font-weight: 500; }
.link a:hover { text-decoration: underline; }
</style>
