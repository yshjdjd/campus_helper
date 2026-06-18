<template>
  <div class="task-create">
    <el-card>
      <h2>发布任务</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="简要描述你的需求" maxlength="128" show-word-limit />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="详细描述任务内容" />
        </el-form-item>
        <el-form-item label="分类" prop="category_id">
          <el-select v-model="form.category_id" placeholder="选择分类">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="赏金">
          <el-input-number v-model="form.reward" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="截止时间" prop="deadline">
          <el-date-picker v-model="form.deadline" type="datetime" placeholder="选择截止时间" />
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="form.location" placeholder="可选" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">发布任务</el-button>
          <el-button @click="router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const formRef = ref()
const loading = ref(false)
const categories = ref([])
const form = reactive({
  title: '', description: '', category_id: '', reward: 0, deadline: null, location: '',
})
const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择分类', trigger: 'change' }],
  deadline: [{ required: true, message: '请选择截止时间', trigger: 'change' }],
}

async function loadCategories() {
  const res = await api.get('/categories')
  categories.value = res.data.data
}

async function handleSubmit() {
  await formRef.value.validate()
  loading.value = true
  try {
    const data = { ...form }
    if (data.deadline) data.deadline = new Date(data.deadline).toISOString()
    const res = await api.post('/tasks', data)
    ElMessage.success('发布成功')
    router.push(`/tasks/${res.data.data.id}`)
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '发布失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadCategories)
</script>

<style scoped>
.task-create { max-width: 700px; margin: 0 auto; }
.task-create h2 { margin-bottom: 20px; }
</style>
