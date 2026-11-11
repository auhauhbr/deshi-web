import { api, TOKEN_STORAGE_KEY } from './api.js'

export async function registerUser({ email, name, password, profile }) {
  const { data } = await api.post('/users', { email, name, password, profile })
  return data
}

export async function loginUser({ email, password }) {
  const { data } = await api.post('/login', { email, password })
  localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
  return data.user
}

export async function logoutUser() {
  try {
    await api.post('/logout')
  } finally {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

export function getApiErrorMessage(error, fallbackMessage) {
  if (error.code === 'ECONNABORTED') return 'A conexão demorou demais. Tente novamente.'
  if (!error.response) return 'Não foi possível conectar ao servidor. Verifique se a API está em execução.'
  return typeof error.response.data === 'string'
    ? error.response.data
    : error.response.data?.message || fallbackMessage
}
