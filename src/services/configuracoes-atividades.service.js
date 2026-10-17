import { apiRequest } from './api'
import { METRICAS_ATIVIDADE, metricaPermitida } from '../utils/metricas-atividade'

const camposPath = (id) => `/atividades/${encodeURIComponent(id)}/campos-configuracao`

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
  const data = await apiRequest(camposPath(atividadeId), { signal })
  if (data?.atividadeId !== atividadeId) throw new Error('Não foi possível ler as informações desta atividade. Tente novamente.')
  return validarCampos(data.campos)
}

export function definirCamposAtividade(atividadeId, campos, signal) {
  return apiRequest(camposPath(atividadeId), { method: 'POST', body: { campos: validarCampos(campos) }, signal })
}

export function criarConfiguracaoAtividade(atividadeId, valores, signal) {
  if (!valores || typeof valores !== 'object' || Array.isArray(valores) || Object.entries(valores).some(([chave, value]) => !metricaPermitida(chave) || !Number.isFinite(value))) {
    throw new Error('Confira os valores informados antes de salvar.')
  }
  return apiRequest(`/atividades/${encodeURIComponent(atividadeId)}/configuracoes`, { method: 'POST', body: { valores }, signal })
}

export function buscarConfiguracao(id, signal) {
  return apiRequest(`/configuracoes-atividades/${encodeURIComponent(id)}`, { signal })
}
