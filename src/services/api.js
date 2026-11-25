import axios from 'axios'
import { beginApiRequest, endApiRequest } from './apiLoadingState.js'

const TOKEN_STORAGE_KEY = 'deshi.token'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3030`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)

  if (token) config.headers.Authorization = `Bearer ${token}`
  const requestPath = (config.url || '').split('?')[0].replace(/\/+$/, '')
  config.__deshiLoadingTracked = requestPath !== '/login'
  if (config.__deshiLoadingTracked) beginApiRequest()

  return config
})

function finishTrackedRequest(config) {
  if (!config?.__deshiLoadingTracked) return
  config.__deshiLoadingTracked = false
  endApiRequest()
}

api.interceptors.response.use(
  (response) => {
    finishTrackedRequest(response.config)
    return response
  },
  (error) => {
    finishTrackedRequest(error.config)
    const requestUrl = error.config?.url || ''
    const isPublicAuthRequest = requestUrl.includes('/login') || requestUrl.includes('/users')
    const authorization = error.config?.headers?.get?.('Authorization')
      || error.config?.headers?.Authorization
      || error.config?.headers?.authorization
    const hasAuthorization = Boolean(authorization)

    if (error.response?.status === 401 && hasAuthorization && !isPublicAuthRequest) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem('deshi.user')
      window.dispatchEvent(new Event('deshi:session-expired'))
    }

    return Promise.reject(error)
  },
)

export { TOKEN_STORAGE_KEY }

export function hasSession() {
  return Boolean(localStorage.getItem(TOKEN_STORAGE_KEY))
}
