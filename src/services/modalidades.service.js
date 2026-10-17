import { apiRequest } from './api'

function validateModalidades(data) {
  if (!Array.isArray(data) || data.some((item) =>
    !item || typeof item.id !== 'string' || typeof item.nome !== 'string')) {
    throw new Error('Não foi possível ler as modalidades retornadas pelo servidor. Tente novamente.')
  }
  return data
}

export async function getModalidades(signal) {
  return validateModalidades(await apiRequest('/modalidades', { signal }))
}

export async function getMinhasModalidades(signal) {
  return validateModalidades(await apiRequest('/modalidades/minhas', { signal }))
}

export async function saveModalidades(modalidadeIds) {
  const response = await apiRequest('/modalidades/minhas', {
    method: 'PUT',
    body: { modalidadeIds },
  })
  // The PUT response shape is unspecified; reload if it does not return the list.
  return Array.isArray(response) ? validateModalidades(response) : getMinhasModalidades()
}
