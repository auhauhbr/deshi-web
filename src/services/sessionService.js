import { api } from './api.js'

export async function getStudentPrograms() {
  const { data } = await api.get('/programs')

  return data
}

export async function startSession(programId) {
  const { data } = await api.post('/sessions', {
    programId
  })

  return data
}

export async function getStudentSessions() {
  const { data } = await api.get('/sessions/history')

  return data
}

export async function registerExecution(sessionId, execution) {
  const { data } = await api.post(`/sessions/${sessionId}/executions`, execution)

  return data
}
