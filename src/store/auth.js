import { create } from 'zustand'
import api from '../lib/api'

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('ipix_token') || null,
  loading: true,

  login: async (email, password) => {
    const data = await api.post('/auth/login', { email, password })
    localStorage.setItem('ipix_token', data.token)
    set({ user: data.user, token: data.token })
    return data
  },

  logout: () => {
    localStorage.removeItem('ipix_token')
    set({ user: null, token: null })
  },

  fetchMe: async () => {
    const token = get().token
    if (!token) { set({ loading: false }); return }
    try {
      const data = await api.get('/auth/me')
      set({ user: data.data, loading: false })
    } catch {
      localStorage.removeItem('ipix_token')
      set({ user: null, token: null, loading: false })
    }
  },

  isAdmin: () => get().user?.role === 'admin',
  isManager: () => ['admin', 'manager'].includes(get().user?.role),
}))

export default useAuthStore
