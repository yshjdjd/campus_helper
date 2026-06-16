<template>
  <div class="admin-panel">
    <h2>管理后台</h2>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="分类管理" name="categories">
        <el-button type="primary" size="small" @click="showAddCategory" style="margin-bottom:12px">新增分类</el-button>
        <el-table :data="categories" border>
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="sort_order" label="排序" width="80" />
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.is_active ? 'success' : 'info'">{{ row.is_active ? '启用' : '禁用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button size="small" @click="editCategory(row)">编辑</el-button>
              <el-button size="small" :type="row.is_active ? 'warning' : 'success'" @click="toggleCategory(row)">{{ row.is_active ? '禁用' : '启用' }}</el-button>
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
    </el-tabs>

    <el-dialog v-model="dialogVisible" :title="editingCategory.id ? '编辑分类' : '新增分类'" width="400px">
      <el-form :model="editingCategory" label-width="60px">
        <el-form-item label="名称"><el-input v-model="editingCategory.name" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="editingCategory.sort_order" :min="0" /></el-form-item>
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
import api from '../api'
import { ElMessage } from 'element-plus'

const activeTab = ref('categories')
const categories = ref([])
const users = ref([])
const dialogVisible = ref(false)
const editingCategory = reactive({ id: null, name: '', sort_order: 0 })

async function loadCategories() {
  const res = await api.get('/admin/categories', { params: { all: '1' } })
  categories.value = res.data.data
}

async function loadUsers() {
  const res = await api.get('/admin/users')
  users.value = res.data.data.rows
}

function showAddCategory() {
  editingCategory.id = null; editingCategory.name = ''; editingCategory.sort_order = 0
  dialogVisible.value = true
}

function editCategory(row) {
  editingCategory.id = row.id; editingCategory.name = row.name; editingCategory.sort_order = row.sort_order
  dialogVisible.value = true
}

async function saveCategory() {
  try {
    if (editingCategory.id) {
      await api.put(`/admin/categories/${editingCategory.id}`, { name: editingCategory.name, sort_order: editingCategory.sort_order })
    } else {
      await api.post('/admin/categories', { name: editingCategory.name, sort_order: editingCategory.sort_order })
    }
    ElMessage.success('保存成功'); dialogVisible.value = false; loadCategories()
  } catch (err) { ElMessage.error(err.response?.data?.message || '操作失败') }
}

async function toggleCategory(row) {
  try { await api.put(`/admin/categories/${row.id}`, { is_active: row.is_active ? 0 : 1 }); loadCategories() }
  catch (err) { ElMessage.error('操作失败') }
}

async function toggleBan(row) {
  try {
    if (row.is_banned) { await api.put(`/admin/users/${row.id}/unban`); ElMessage.success('已解禁') }
    else { await api.put(`/admin/users/${row.id}/ban`); ElMessage.success('已禁用') }
    loadUsers()
  } catch (err) { ElMessage.error(err.response?.data?.message || '操作失败') }
}

onMounted(() => { loadCategories(); loadUsers() })
</script>

<style scoped>
.admin-panel { max-width: 900px; margin: 0 auto; }
.admin-panel h2 { margin-bottom: 20px; }
</style>
