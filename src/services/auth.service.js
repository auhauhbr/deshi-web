import { apiRequest } from './api'
import { saveSession } from './session'

export async function login(email, password) {
  const response = await apiRequest('/login', {
    method: 'POST',
    authenticated: false,
    body: { email, password },
  })
  saveSession(response)
}
