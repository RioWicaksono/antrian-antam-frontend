import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const getBaseURL = () => {
  // In production (Vercel), use the environment variable with /api appended
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL + '/api'
  }
  // In development, use relative path which proxies to localhost:8081
  return '/api'
}

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ============ Auth ============
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { oldPassword, newPassword }),
}

// ============ Dashboard ============
export const dashboardApi = {
  stats: () => api.get('/dashboard/stats').then(r => r.data),
  settings: () => api.get('/dashboard/settings').then(r => r.data),
  updateSettings: (data: Record<string, unknown>) =>
    api.patch('/dashboard/settings', data).then(r => r.data),
}

// ============ Accounts ============
export const accountsApi = {
  list: () => api.get('/accounts').then(r => r.data),
  get: (id: number) => api.get(`/accounts/${id}`).then(r => r.data),
  create: (data: unknown) => api.post('/accounts', data).then(r => r.data),
  update: (id: number, data: unknown) => api.put(`/accounts/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/accounts/${id}`),
  assignProxy: (id: number, proxyId: number | null) =>
    api.patch(`/accounts/${id}/proxy`, { proxyId }),
  bulkText: (text: string) => api.post('/accounts/bulk-text', { text }).then(r => r.data),
}

// ============ Proxies ============
export const proxiesApi = {
  list: () => api.get('/proxies').then(r => r.data),
  get: (id: number) => api.get(`/proxies/${id}`).then(r => r.data),
  create: (data: unknown) => api.post('/proxies', data).then(r => r.data),
  update: (id: number, data: unknown) => api.put(`/proxies/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/proxies/${id}`),
  checkHealth: (id: number) => api.post(`/proxies/${id}/check`).then(r => r.data),
  bulkText: (text: string) => api.post('/proxies/bulk-text', { text }).then(r => r.data),
}

// ============ Rings ============
export const ringsApi = {
  list: () => api.get('/rings').then(r => r.data),
  listActive: () => api.get('/rings/active').then(r => r.data),
  get: (id: number) => api.get(`/rings/${id}`).then(r => r.data),
  create: (data: unknown) => api.post('/rings', data).then(r => r.data),
  update: (id: number, data: unknown) => api.put(`/rings/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/rings/${id}`),
}

// ============ Branches ============
export const branchesApi = {
  list: () => api.get('/branches').then(r => r.data),
}

// ============ Tasks ============
export const tasksApi = {
  list: () => api.get('/tasks').then(r => r.data),
  get: (id: number) => api.get(`/tasks/${id}`).then(r => r.data),
  create: (data: unknown) => api.post('/tasks', data).then(r => r.data),
  start: (id: number) => api.post(`/tasks/${id}/start`).then(r => r.data),
  cancel: (id: number) => api.post(`/tasks/${id}/cancel`).then(r => r.data),
  delete: (id: number) => api.delete(`/tasks/${id}`),
  logs: (id: number, limit = 500) =>
    api.get(`/tasks/${id}/logs?limit=${limit}`).then(r => r.data),
  tickets: (id: number) => api.get(`/tasks/${id}/tickets`).then(r => r.data),
}

// ============ Tickets ============
export const ticketsApi = {
  list: () => api.get('/tickets').then(r => r.data),
  get: (id: number) => api.get(`/tickets/${id}`).then(r => r.data),
}

// ============ Monitor ============
export const monitorApi = {
  info: () => api.get('/monitor/info').then(r => r.data),
  // Returns null when no check has been performed yet (HTTP 204)
  status: () => api.get('/monitor/status', { validateStatus: s => s === 200 || s === 204 })
    .then(r => (r.status === 204 ? null : r.data)),
  // Trigger can take up to 90s — override default 30s timeout
  trigger: () => api.post('/monitor/trigger', null, { timeout: 90_000 }).then(r => r.data),
  config: (data: { enabled: boolean }) => api.post('/monitor/config', data).then(r => r.data),
}

// ============ Captcha Learning DB ============
export const captchaDbApi = {
  list: (type?: string) =>
    api.get('/captcha-db', { params: type ? { type } : {} }).then(r => r.data),
  pending: () => api.get('/captcha-db/pending').then(r => r.data),
  stats: () => api.get('/captcha-db/stats').then(r => r.data),
  confirmAnswer: (id: number, answer: string) =>
    api.post(`/captcha-db/${id}/answer`, { answer }).then(r => r.data),
  clearAnswer: (id: number) =>
    api.delete(`/captcha-db/${id}/answer`).then(r => r.data),
  delete: (id: number) => api.delete(`/captcha-db/${id}`),
}

export default api
