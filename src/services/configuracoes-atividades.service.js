import { api } from './api.js'
import { getApiErrorMessage } from './authService.js'
import { METRICAS_ATIVIDADE, metricaPermitida } from '../utils/metricas-atividade.js'

const camposPath = (id) => `/atividades/${encodeURIComponent(id)}/campos-configuracao`

function apiFailure(error, fallback) {
  const failure = new Error(getApiErrorMessage(error, fallback))
  failure.status = error.response?.status
  throw failure
}

function validarCampos(campos) {
  if (!Array.isArray(campos) || !campos.length || new Set(campos.map((campo) => campo?.chave)).size !== campos.length || campos.some((campo) => {
    if (!campo || !metricaPermitida(campo.chave)) return true
    const metrica = METRICAS_ATIVIDADE[campo.chave]
    return campo.tipo !== metrica.tipo || campo.unidade !== metrica.unidade || typeof campo.obrigatorio !== 'boolean' ||
      (campo.min !== undefined && !Number.isFinite(campo.min)) ||
      (campo.max !== undefined && !Number.isFinite(campo.max)) ||
      (campo.min !== undefined && campo.max !== undefined && campo.min > campo.max)
  })) {
    throw new Error('Não foi possível ler as informações de configuração desta atividade. Tente novamente.')
  }
  return campos.map(({ chave, tipo, obrigatorio, unidade, min, max }) => ({ chave, tipo, obrigatorio, unidade, ...(min !== undefined ? { min } : {}), ...(max !== undefined ? { max } : {}) }))
}

export async function buscarCamposAtividade(atividadeId, signal) {
  let data
  try {
    const response = await api.get(camposPath(atividadeId), { signal })
    data = response.data
  } catch (error) {
    apiFailure(error, 'Não foi possível carregar a configuração da atividade.')
  }
  if (data?.atividadeId !== atividadeId) throw new Error('Não foi possível ler as informações desta atividade. Tente novamente.')
  return validarCampos(data.campos)
}

export function definirCamposAtividade(atividadeId, campos, signal) {
  return api.post(camposPath(atividadeId), { campos: validarCampos(campos) }, { signal })
    .then(({ data }) => data)
    .catch((error) => apiFailure(error, 'Não foi possível salvar os campos da atividade.'))
}

export function criarConfiguracaoAtividade(atividadeId, valores, signal) {
  if (!valores || typeof valores !== 'object' || Array.isArray(valores) || Object.entries(valores).some(([chave, value]) => !metricaPermitida(chave) || !Number.isFinite(value))) {
    throw new Error('Confira os valores informados antes de salvar.')
  }
  return api.post(`/atividades/${encodeURIComponent(atividadeId)}/configuracoes`, { valores }, { signal })
    .then(({ data }) => data)
    .catch((error) => apiFailure(error, 'Não foi possível salvar a configuração da atividade.'))
}

export function buscarConfiguracao(id, signal) {
  return api.get(`/configuracoes-atividades/${encodeURIComponent(id)}`, { signal })
    .then(({ data }) => data)
    .catch((error) => apiFailure(error, 'Não foi possível carregar a configuração da atividade.'))
}
