import { apiRequest } from './api'

function isAtividade(item) {
  return item && typeof item.id === 'string' && typeof item.nome === 'string' &&
    typeof item.modalidadeId === 'string' &&
    ['PADRAO', 'PERSONALIZADA'].includes(item.origem) &&
    (item.descricao == null || typeof item.descricao === 'string') &&
    (item.midiaUrl == null || typeof item.midiaUrl === 'string')
}

export async function listarAtividades({ busca, modalidadeId } = {}, signal) {
  const params = new URLSearchParams()
  if (busca?.trim()) params.set('busca', busca.trim())
  if (modalidadeId?.trim()) params.set('modalidadeId', modalidadeId.trim())
  const query = params.toString()
  const data = await apiRequest(`/atividades${query ? `?${query}` : ''}`, { signal })
  if (!Array.isArray(data) || !data.every(isAtividade)) {
    throw new Error('Não foi possível ler as atividades retornadas pelo servidor. Tente novamente.')
  }
  return data
}

export async function criarAtividade({ nome, modalidadeId, descricao, midiaUrl }, signal) {
  const body = { nome: nome.trim(), modalidadeId }
  if (descricao?.trim()) body.descricao = descricao.trim()
  if (midiaUrl?.trim()) body.midiaUrl = midiaUrl.trim()
  return apiRequest('/atividades', { method: 'POST', body, signal })
}
