import { api } from './api.js'

export async function getProfessionalStudentDashboard(studentId) {
  const [studentsResponse, sessionsResponse, programsResponse, evolutionResponse, bodyMetricsResponse] = await Promise.all([
    api.get('/vinculos/alunos'),
    api.get(`/students/${studentId}/sessions/history`),
    api.get('/programas'),
    api.get(`/students/${studentId}/evolution`),
    api.get(`/students/${studentId}/body-metrics`),
  ])

  const student = studentsResponse.data.find((item) => item.id === studentId)

  return {
    student: student || null,
    sessions: sessionsResponse.data,
    programs: programsResponse.data.filter((program) => program.alunoId === studentId),
    evolution: evolutionResponse.data.evolution || [],
    bodyMetrics: bodyMetricsResponse.data,
  }
}

