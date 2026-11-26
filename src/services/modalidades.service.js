import { api } from './api.js'

function validateModalidades(data) {
  if (!Array.isArray(data) || data.some((item) =>
    !item || typeof item.id !== 'string' || typeof item.nome !== 'string')) {
    throw new Error('Não foi possível ler as modalidades retornadas pelo servidor. Tente novamente.')
  }
  return data
}

export async function getModalidades(signal) {
  const { data } = await api.get('/modalidades', { signal })
  return validateModalidades(data)
}

export async function getMinhasModalidades(signal, { skipGlobalLoading = false } = {}) {
  const { data } = await api.get('/modalidades/minhas', { signal, skipGlobalLoading })
  return validateModalidades(data)
}

export async function saveModalidades(modalidadeIds) {
  const { data } = await api.put('/modalidades/minhas', { modalidadeIds })
  return validateModalidades(data)
}
