import { api } from './api.js'

export async function getLinkedStudents() {
  const { data } = await api.get('/vinculos/alunos')

  return data
}
