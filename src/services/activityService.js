import { api } from './api.js'

export async function getProfessionalActivities() {
  const { data } = await api.get('/atividades')

  return data
}
