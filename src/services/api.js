import axios from 'axios'

const TOKEN_STORAGE_KEY = 'deshi.token'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)

  if (token) config.headers.Authorization = `Bearer ${token}`

  return config
})

export { TOKEN_STORAGE_KEY }

export function hasSession() {
  return Boolean(localStorage.getItem(TOKEN_STORAGE_KEY))
}
