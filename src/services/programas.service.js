import { api } from './api.js'
import { getApiErrorMessage } from './authService.js'

function throwApiError(error, fallback) {
  const failure = new Error(getApiErrorMessage(error, fallback))
  failure.status = error.response?.status
  throw failure
}

export async function buscarPrograma(programId, signal) {
  try {
    const { data } = await api.get(`/programas/${encodeURIComponent(programId)}`, { signal })
    return data
  } catch (error) {
    throwApiError(error, 'Não foi possível carregar o programa de treino.')
  }
}

export async function criarPrograma(programa, signal) {
  try {
    const { data } = await api.post('/programas', programa, { signal })
    return data
  } catch (error) {
    throwApiError(error, 'Não foi possível salvar o programa de treino.')
  }
}

export async function atualizarPrograma(programId, programa, signal) {
  try {
    const { data } = await api.put(`/programas/${encodeURIComponent(programId)}`, programa, { signal })
    return data
  } catch (error) {
    throwApiError(error, 'Não foi possível atualizar o programa de treino.')
  }
}
