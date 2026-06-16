import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue'), meta: { guest: true } },
  { path: '/register', name: 'Register', component: () => import('../views/Register.vue'), meta: { guest: true } },
  {
    path: '/',
    name: 'Layout',
    component: () => import('../views/Layout.vue'),
    children: [
      { path: '', name: 'TaskList', component: () => import('../views/TaskList.vue') },
      { path: 'tasks/create', name: 'TaskCreate', component: () => import('../views/TaskCreate.vue'), meta: { auth: true } },
      { path: 'tasks/:id', name: 'TaskDetail', component: () => import('../views/TaskDetail.vue') },
      { path: 'users/:id', name: 'UserProfile', component: () => import('../views/UserProfile.vue') },
      { path: 'messages', name: 'Messages', component: () => import('../views/Messages.vue'), meta: { auth: true } },
      { path: 'my', name: 'MyTasks', component: () => import('../views/MyTasks.vue'), meta: { auth: true } },
      { path: 'profile', name: 'Profile', component: () => import('../views/Profile.vue'), meta: { auth: true } },
      { path: 'admin', name: 'Admin', component: () => import('../views/AdminPanel.vue'), meta: { auth: true, admin: true } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.auth && !authStore.isLoggedIn) next('/login')
  else if (to.meta.admin && !authStore.isAdmin) next('/')
  else if (to.meta.guest && authStore.isLoggedIn) next('/')
  else next()
})

export default router
