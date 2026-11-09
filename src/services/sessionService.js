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

async function sendActivityAction(sessionId, activityId, action) {
  const { data } = await api.post(
    `/sessions/${sessionId}/activities/${activityId}/${action}`,
  )

  return data
}

export function startActivity(sessionId, activityId) {
  return sendActivityAction(sessionId, activityId, 'start')
}

export function pauseActivity(sessionId, activityId) {
  return sendActivityAction(sessionId, activityId, 'pause')
}

export function resumeActivity(sessionId, activityId) {
  return sendActivityAction(sessionId, activityId, 'resume')
}

export function startActivityRest(sessionId, activityId) {
  return sendActivityAction(sessionId, activityId, 'rest/start')
}

export function endActivityRest(sessionId, activityId) {
  return sendActivityAction(sessionId, activityId, 'rest/end')
}

export function completeActivity(sessionId, activityId) {
  return sendActivityAction(sessionId, activityId, 'complete')
}
