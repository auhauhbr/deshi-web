import { api } from './api.js'
import { getApiErrorMessage } from './authService.js'

function requestError(error, fallback) {
  const failure = new Error(getApiErrorMessage(error, fallback))
  failure.status = error.response?.status
  throw failure
}

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
  let data
  try {
    const response = await api.get(`/atividades${query ? `?${query}` : ''}`, { signal })
    data = response.data
  } catch (error) {
    requestError(error, 'Não foi possível carregar as atividades.')
  }
  if (!Array.isArray(data) || !data.every(isAtividade)) {
    throw new Error('Não foi possível ler as atividades retornadas pelo servidor. Tente novamente.')
  }
  return data
}

export async function criarAtividade({ nome, modalidadeId, descricao, midiaUrl, grupoMuscular }, signal) {
  const body = buildActivityBody({ nome, modalidadeId, descricao, midiaUrl, grupoMuscular })
  try {
    const { data } = await api.post('/atividades', body, { signal })
    return data
  } catch (error) {
    requestError(error, 'Não foi possível criar a atividade.')
  }
}

function buildActivityBody({ nome, modalidadeId, descricao, midiaUrl, grupoMuscular }) {
  return {
    nome: nome.trim(),
    modalidadeId,
    ...(descricao?.trim() ? { descricao: descricao.trim() } : {}),
    ...(midiaUrl?.trim() ? { midiaUrl: midiaUrl.trim() } : {}),
    ...(grupoMuscular?.trim() ? { grupoMuscular: grupoMuscular.trim() } : {})
  }
}

export async function atualizarAtividade(id, dados, signal) {
  try {
    const { data } = await api.put(`/atividades/${encodeURIComponent(id)}`, buildActivityBody(dados), { signal })
    return data
  } catch (error) {
    requestError(error, 'Não foi possível atualizar a atividade.')
  }
}
