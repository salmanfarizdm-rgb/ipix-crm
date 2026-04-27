import { create } from 'zustand'
import api from '../lib/api.js'

export const useAuth = create((set, get) => ({
  user: null,
  token: localStorage.getItem('nk_token'),
  loading: false,

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('nk_token', res.token)
    set({ user: res.user, token: res.token })
    return res
  },

  logout: async () => {
    try { await api.post('/auth/logout') } catch (_) {}
    localStorage.removeItem('nk_token')
    set({ user: null, token: null })
  },

  fetchMe: async () => {
    try {
      const res = await api.get('/auth/me')
      set({ user: res.data })
    } catch (_) {
      // Session expired or invalid — clear everything and redirect to login
      localStorage.removeItem('nk_token')
      set({ user: null, token: null })
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
  },

  isAdmin:   () => ['admin'].includes(get().user?.role),
  isManager: () => ['admin','branch_manager','sales_manager'].includes(get().user?.role),
  canSeeAll: () => ['admin','branch_manager','sales_manager'].includes(get().user?.role),
}))
