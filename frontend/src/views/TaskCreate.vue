<template>
  <div class="task-create">
    <el-card>
      <h2>发布任务</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="简要描述你的需求" maxlength="128" show-word-limit />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="详细描述任务内容" />
        </el-form-item>
        <el-form-item label="分类" prop="category_id">
          <el-select v-model="form.category_id" placeholder="选择分类" @change="onCategoryChange">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="赏金" v-if="form.category_id != 6">
          <el-input-number v-model="form.reward" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="接单人数" v-if="form.category_id != 6">
          <el-input-number v-model="form.max_acceptors" :min="0" placeholder="0表示无上限" />
          <span style="margin-left:8px;color:#999;font-size:13px">0 = 不限制人数</span>
        </el-form-item>
        <el-form-item label="截止时间" prop="deadline" v-if="form.category_id != 6">
          <el-date-picker v-model="form.deadline" type="datetime" placeholder="选择截止时间" />
        </el-form-item>
        <el-form-item label="地点" v-if="form.category_id != 1 && form.category_id != 6">
          <el-input v-model="form.location" placeholder="可选" />
        </el-form-item>

        <!-- 动态自定义字段（根据分类模板） -->
        <el-form-item
          v-for="field in templateFields"
          :key="field.key"
          :label="field.label"
          :prop="'custom.' + field.key"
          :rules="field.required ? [{ required: true, message: '请填写' + field.label, trigger: 'blur' }] : []"
        >
          <el-input v-model="form.custom[field.key]" :placeholder="'请输入' + field.label" maxlength="255" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref()
const loading = ref(false)
const categories = ref([])
const templateFields = ref([])
const form = reactive({
  title: '', description: '', category_id: '', reward: 0, deadline: null, location: '', max_acceptors: 0,
  custom: {},
})

const rules = computed(() => {
  const base = {
    title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
    description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
    category_id: [{ required: true, message: '请选择分类', trigger: 'change' }],
  }
  if (form.category_id != 6) {
    base.deadline = [{ required: true, message: '请选择截止时间', trigger: 'change' }]
  }
  return base
})

async function loadCategories() {
  const res = await api.get('/categories')
  categories.value = res.data.data
}

function onCategoryChange(val) {
  form.custom = {}
  const cat = categories.value.find(c => c.id == val)
  if (!cat) { templateFields.value = []; return }

  // 权限检查
  if (cat.allowed_roles) {
    let roles
    try { roles = typeof cat.allowed_roles === 'string' ? JSON.parse(cat.allowed_roles) : cat.allowed_roles }
    catch { roles = null }
    if (roles && Array.isArray(roles) && roles.length > 0) {
      const userRole = authStore.user?.role
      if (userRole && !roles.includes(userRole)) {
        ElMessageBox.alert(`该分类仅限 ${roles.map(r => ({ admin: '管理员', teacher: '教师', student: '学生' })[r]).join('、')} 发布`, '无权限', { type: 'warning' })
        form.category_id = ''
        templateFields.value = []
        return
      }
    }
  }

  if (cat.template_config) {
    let tpl
    try { tpl = typeof cat.template_config === 'string' ? JSON.parse(cat.template_config) : cat.template_config }
    catch { tpl = [] }
    templateFields.value = Array.isArray(tpl) ? tpl : []
  } else {
    templateFields.value = []
  }
}

async function handleSubmit() {
  await formRef.value.validate()
  loading.value = true
  try {
    const data = { ...form }
    delete data.custom
    data.custom_data = JSON.stringify(form.custom)
    if (data.deadline) data.deadline = new Date(data.deadline).toISOString()
    else data.deadline = null
    if (!data.max_acceptors || data.max_acceptors <= 0) data.max_acceptors = null
    if (!data.location) data.location = null
    if (!data.reward) data.reward = null
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
