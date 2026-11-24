import { api } from './api.js'

export async function getProfessionalStudentDashboard(studentId) {
  const [studentsResponse, sessionsResponse, programsResponse, evolutionResponse] = await Promise.all([
    api.get('/vinculos/alunos'),
    api.get(`/students/${studentId}/sessions/history`),
    api.get('/programas'),
    api.get(`/students/${studentId}/evolution`),
  ])

  const student = studentsResponse.data.find((item) => item.id === studentId)

  return {
    student: student || null,
    sessions: sessionsResponse.data,
    programs: programsResponse.data.filter((program) => program.alunoId === studentId),
    evolution: evolutionResponse.data.evolution || [],
  }
}

