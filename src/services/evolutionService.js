import { api } from './api.js'

export async function getStudentEvolution(studentId, filters = {}) {
  const params = {}

  if (filters.activityId) params.activityId = filters.activityId
  if (filters.metric) params.metric = filters.metric

  const { data } = await api.get(`/students/${studentId}/evolution`, { params })

  return data
}
