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
        <el-form-item label="接单人数">
          <el-input-number v-model="form.max_acceptors" :min="0" placeholder="0表示无上限" />
          <span style="margin-left:8px;color:#999;font-size:13px">0 = 不限制人数</span>
        </el-form-item>
        <el-form-item label="截止时间" prop="deadline">
          <el-date-picker v-model="form.deadline" type="datetime" placeholder="选择截止时间" />
        </el-form-item>
        <!-- 非跑腿代拿分类时显示通用地点 -->
        <el-form-item label="地点" v-if="form.category_id !== 1 && form.category_id !== '1'">
          <el-input v-model="form.location" placeholder="可选" />
        </el-form-item>
        <!-- 跑腿代拿专属字段 -->
        <template v-if="form.category_id === 1 || form.category_id === '1'">
          <el-form-item label="代拿地" prop="pickup_location">
            <el-input v-model="form.pickup_location" placeholder="例如：菜鸟驿站" maxlength="255" />
          </el-form-item>
          <el-form-item label="目的地" prop="delivery_location">
            <el-input v-model="form.delivery_location" placeholder="例如：7号宿舍楼" maxlength="255" />
          </el-form-item>
        </template>
        <!-- 学业互助专属字段 -->
        <template v-if="form.category_id === 2 || form.category_id === '2'">
          <el-form-item label="学科" prop="subject">
            <el-select v-model="form.subject" placeholder="选择或输入学科" clearable filterable allow-create>
              <el-option v-for="s in subjects" :key="s" :label="s" :value="s" />
            </el-select>
          </el-form-item>
        </template>
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
  title: '', description: '', category_id: '', reward: 0, deadline: null, location: '', max_acceptors: 0,
  pickup_location: '', delivery_location: '', subject: '',
})

const subjects = [
  '高等数学', '线性代数', '概率论', '大学物理', '大学英语',
  'Python', 'C语言', 'Java', '数据结构', '操作系统',
  '计算机网络', '数据库', '人工智能', '机器学习',
  '会计学', '经济学', '管理学', '法学', '医学', '其他',
]

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择分类', trigger: 'change' }],
  deadline: [{ required: true, message: '请选择截止时间', trigger: 'change' }],
  pickup_location: [{ required: true, message: '请输入代拿地', trigger: 'blur' }],
  delivery_location: [{ required: true, message: '请输入目的地', trigger: 'blur' }],
  subject: [{ required: true, message: '请选择或输入学科', trigger: 'change' }],
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
    const catId = parseInt(data.category_id)
    // 分类专属字段互斥清理
    if (catId !== 1) {
      delete data.pickup_location
      delete data.delivery_location
    } else {
      data.location = null
    }
    if (catId !== 2) {
      delete data.subject
    }
    if (!data.location) data.location = null
    if (data.deadline) data.deadline = new Date(data.deadline).toISOString()
    if (!data.max_acceptors || data.max_acceptors <= 0) data.max_acceptors = null
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
