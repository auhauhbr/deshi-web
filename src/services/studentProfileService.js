import { api } from './api.js'
import { updateStoredUser } from './authService.js'

export async function updateStudentProfile(fields) {
  const { data } = await api.put('/users/me/profile', fields)
  return updateStoredUser(data)
}

export async function changeStudentPassword({ currentPassword, newPassword, confirmPassword }) {
  await api.put('/users/me/password', { currentPassword, newPassword, confirmPassword })
}
