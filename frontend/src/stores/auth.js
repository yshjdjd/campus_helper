import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)

  async function register(form) {
    const res = await api.post('/auth/register', form)
    return res.data
  }

  async function login(form) {
    const res = await api.post('/auth/login', form)
    const { token: t, user: u } = res.data.data
    token.value = t
    user.value = u
    localStorage.setItem('token', t)
    localStorage.setItem('user', JSON.stringify(u))
    return res.data
  }

  async function fetchProfile() {
    const res = await api.get('/auth/profile')
    user.value = res.data.data
    localStorage.setItem('user', JSON.stringify(res.data.data))
    return res.data
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { token, user, isLoggedIn, register, login, fetchProfile, logout }
})
