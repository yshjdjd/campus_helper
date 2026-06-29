<template>
  <div class="admin-panel">
    <h2>管理后台</h2>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="分类管理" name="categories">
        <el-button type="primary" size="small" @click="showAddCategory" style="margin-bottom:12px">新增分类</el-button>
        <el-table :data="categories" border>
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column label="名称">
            <template #default="{ row }">
              <span class="category-name">
                <span v-if="row.id <= 6" class="fixed-dot"></span>
                {{ row.name }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.is_active ? 'success' : 'info'">{{ row.is_active ? '启用' : '禁用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="300">
            <template #default="{ row, $index }">
              <el-button size="small" @click="editCategory(row)">编辑</el-button>
              <el-button size="small" :type="row.is_active ? 'warning' : 'success'" @click="toggleCategory(row)">{{ row.is_active ? '禁用' : '启用' }}</el-button>
              <el-button size="small" @click="moveUp($index)" :disabled="$index === 0">
                <el-icon><Top /></el-icon>
              </el-button>
              <el-button size="small" @click="moveDown($index)" :disabled="$index === categories.length - 1">
                <el-icon><Bottom /></el-icon>
              </el-button>
              <el-button v-if="row.id > 6" size="small" type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="用户管理" name="users">
        <el-table :data="users" border>
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="student_id" label="学号" width="120" />
          <el-table-column prop="username" label="昵称" />
          <el-table-column prop="role" label="身份" width="80" />
          <el-table-column prop="credit_score" label="信用分" width="80" />
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.is_banned ? 'danger' : 'success'">{{ row.is_banned ? '已禁用' : '正常' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button v-if="row.role !== 'admin'" size="small" :type="row.is_banned ? 'success' : 'danger'" @click="toggleBan(row)">{{ row.is_banned ? '解禁' : '禁用' }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="任务管理" name="tasks">
        <el-table :data="tasks" border style="width:100%">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
          <el-table-column prop="publisher_name" label="发布者" width="100" />
          <el-table-column prop="category_name" label="分类" width="90" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="statusTypeMap[row.status] || 'info'" size="small">{{ statusLabelMap[row.status] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="reward" label="赏金" width="70">
            <template #default="{ row }">💰 {{ row.reward }}</template>
          </el-table-column>
          <el-table-column label="发布时间" width="160">
            <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="danger" @click="handleForceDelete(row)">强制删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 编辑/新增分类弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingCategory.id ? '编辑分类' : '新增分类'" width="560px">
      <el-form :model="editingCategory" label-width="80px">
        <el-form-item label="名称"><el-input v-model="editingCategory.name" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="editingCategory.sort_order" :min="0" /></el-form-item>
        <el-form-item label="发布权限">
          <el-select v-model="editingCategory.allowed_roles" multiple placeholder="不限（所有人可发）" style="width:100%">
            <el-option label="学生" value="student" />
            <el-option label="教师" value="teacher" />
            <el-option label="管理员" value="admin" />
          </el-select>
          <span style="font-size:11px;color:#999">不选 = 所有人可发布；选择后仅指定身份可发布</span>
        </el-form-item>

        <!-- 自定义字段模板 -->
        <el-divider content-position="left">自定义字段模板</el-divider>
        <div class="template-fields">
          <div v-for="(field, idx) in editingCategory.templateFields" :key="idx" class="template-row">
            <el-input v-model="field.label" placeholder="字段名" size="small" style="width:100px" />
            <el-input v-model="field.key" placeholder="键" size="small" style="width:100px" />
            <el-switch v-model="field.required" active-text="必填" size="small" />
            <el-switch v-model="field.searchable" active-text="可搜索" size="small" />
            <el-button size="small" type="danger" :icon="Delete" circle @click="removeField(idx)" />
          </div>
          <el-button size="small" type="primary" plain @click="addField">+ 添加字段</el-button>
        </div>
        <p class="hint">配置后，发布此分类任务时将显示对应的额外输入框。</p>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCategory">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Delete, Top, Bottom } from '@element-plus/icons-vue'
import api from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('categories')
const categories = ref([])
const users = ref([])
const tasks = ref([])
const dialogVisible = ref(false)
const editingCategory = reactive({ id: null, name: '', sort_order: 0, templateFields: [], allowed_roles: [] })

const statusLabelMap = {
  recruiting: '招募中',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
  pinned: '已置顶',
}
const statusTypeMap = {
  recruiting: 'primary',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'info',
  pinned: 'danger',
}
function formatDate(d) { return d ? new Date(d).toLocaleString('zh-CN') : '' }

async function loadCategories() {
  const res = await api.get('/admin/categories', { params: { all: '1' } })
  categories.value = res.data.data
}

async function loadUsers() {
  const res = await api.get('/admin/users')
  users.value = res.data.data.rows
}

function showAddCategory() {
  editingCategory.id = null
  editingCategory.name = ''
  editingCategory.sort_order = 0
  editingCategory.templateFields = []
  editingCategory.allowed_roles = []
  dialogVisible.value = true
}

function editCategory(row) {
  editingCategory.id = row.id
  editingCategory.name = row.name
  editingCategory.sort_order = row.sort_order
  let fields = []
  try { fields = typeof row.template_config === 'string' ? JSON.parse(row.template_config) : (row.template_config || []) }
  catch { fields = [] }
  editingCategory.templateFields = fields.map(f => ({ ...f }))
  let roles = []
  try { roles = typeof row.allowed_roles === 'string' ? JSON.parse(row.allowed_roles) : (row.allowed_roles || []) }
  catch { roles = [] }
  editingCategory.allowed_roles = Array.isArray(roles) ? roles : []
  dialogVisible.value = true
}

function addField() {
  editingCategory.templateFields.push({ label: '', key: '', required: false, searchable: false })
}

function removeField(idx) {
  editingCategory.templateFields.splice(idx, 1)
}

async function saveCategory() {
  try {
    const payload = {
      name: editingCategory.name,
      sort_order: editingCategory.sort_order,
      template_config: editingCategory.templateFields.length > 0 ? JSON.stringify(editingCategory.templateFields) : null,
      allowed_roles: editingCategory.allowed_roles.length > 0 ? JSON.stringify(editingCategory.allowed_roles) : null,
    }
    if (editingCategory.id) {
      await api.put(`/admin/categories/${editingCategory.id}`, payload)
    } else {
      await api.post('/admin/categories', payload)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadCategories()
  } catch (err) { ElMessage.error(err.response?.data?.message || '操作失败') }
}

async function toggleCategory(row) {
  try { await api.put(`/admin/categories/${row.id}`, { is_active: row.is_active ? 0 : 1 }); loadCategories() }
  catch (err) { ElMessage.error('操作失败') }
}

async function moveUp(index) {
  if (index === 0) return
  const a = categories.value[index - 1]
  const b = categories.value[index]
  // 交换 sort_order
  const tmp = a.sort_order
  await api.put(`/admin/categories/${a.id}`, { sort_order: b.sort_order })
  await api.put(`/admin/categories/${b.id}`, { sort_order: tmp })
  loadCategories()
}

async function moveDown(index) {
  if (index >= categories.value.length - 1) return
  const a = categories.value[index]
  const b = categories.value[index + 1]
  const tmp = a.sort_order
  await api.put(`/admin/categories/${a.id}`, { sort_order: b.sort_order })
  await api.put(`/admin/categories/${b.id}`, { sort_order: tmp })
  loadCategories()
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除分类「${row.name}」吗？`, '确认删除', { type: 'warning' })
    await api.delete(`/admin/categories/${row.id}`)
    ElMessage.success('删除成功')
    loadCategories()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error(err.response?.data?.message || '删除失败')
  }
}

async function toggleBan(row) {
  try {
    if (row.is_banned) { await api.put(`/admin/users/${row.id}/unban`); ElMessage.success('已解禁') }
    else { await api.put(`/admin/users/${row.id}/ban`); ElMessage.success('已禁用') }
    loadUsers()
  } catch (err) { ElMessage.error(err.response?.data?.message || '操作失败') }
}

async function loadTasks() {
  try {
    const res = await api.get('/admin/tasks', { params: { page: 1, limit: 100 } })
    tasks.value = res.data.data.rows
  } catch (err) { console.error('Load tasks error:', err) }
}

async function handleForceDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定要强制删除任务「${row.title}」吗？<br><small>此操作不可恢复，会同时删除关联的评论、消息和接单记录。</small>`,
      '确认强制删除',
      { type: 'warning', confirmButtonText: '强制删除', dangerouslyUseHTMLString: true }
    )
    await api.delete(`/admin/tasks/${row.id}/force`)
    ElMessage.success('任务已强制删除')
    loadTasks()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error(err.response?.data?.message || '操作失败')
  }
}

onMounted(() => { loadCategories(); loadUsers(); loadTasks() })
</script>

<style scoped>
.admin-panel { max-width: 900px; margin: 0 auto; }
.admin-panel h2 { margin-bottom: 20px; }
.category-name { display: flex; align-items: center; gap: 6px; }
.fixed-dot {
  display: inline-block;
  width: 8px; height: 8px;
  background: #f56c6c;
  border-radius: 50%;
  flex-shrink: 0;
}
.template-fields { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
.template-row { display: flex; align-items: center; gap: 8px; }
.hint { color: #999; font-size: 12px; margin-top: 4px; }
</style>
