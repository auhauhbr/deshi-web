// Closed metric contract; the API decides which metrics each activity uses.
export const METRICAS_ATIVIDADE = {
  series: { label: 'Séries', tipo: 'inteiro', unidade: 'series', min: 1 },
  repeticoes: { label: 'Repetições', tipo: 'inteiro', unidade: 'repeticoes', min: 1 },
  cargaKg: { label: 'Carga', tipo: 'decimal', unidade: 'kg', min: 0 },
  duracaoSegundos: { label: 'Duração', tipo: 'duracao', unidade: 's', min: 1 },
  quantidade: { label: 'Quantidade', tipo: 'inteiro', unidade: 'unidades', min: 1 },
  descansoSegundos: { label: 'Descanso', tipo: 'duracao', unidade: 's', min: 0 },
  distanciaMetros: { label: 'Distância', tipo: 'decimal', unidade: 'm', min: 0.01 },
  rounds: { label: 'Rounds', tipo: 'inteiro', unidade: 'rounds', min: 1 },
  duracaoRoundSegundos: { label: 'Duração do round', tipo: 'duracao', unidade: 's', min: 1 },
}

export const UNIDADES_ATIVIDADE = {
  kg: 'kg', s: 's', m: 'm', series: 'séries', repeticoes: 'repetições', unidades: 'unidades', rounds: 'rounds',
}

export function metricaPermitida(chave) {
  return Object.hasOwn(METRICAS_ATIVIDADE, chave)
}

export function validarValoresAtividade(campos, entradas, form) {
  const errors = {}
  const valores = {}
  for (const campo of campos) {
    const { chave, tipo, obrigatorio, min, max, unidade } = campo
    const { label } = METRICAS_ATIVIDADE[chave]
    const raw = (entradas[chave] ?? '').trim()
    if (form.elements.namedItem(chave)?.validity.badInput) {
      errors[chave] = `Informe um número válido para ${label}.`
      continue
    }
    if (!raw) {
      if (obrigatorio) errors[chave] = `Informe ${label}.`
      continue
    }
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)) {
      errors[chave] = `Informe um número válido para ${label}.`
      continue
    }
    const value = Number(raw)
    if (!Number.isFinite(value)) errors[chave] = `Informe um número válido para ${label}.`
    else if (tipo !== 'decimal' && !Number.isSafeInteger(value)) errors[chave] = `${label} deve ser um número inteiro.`
    else if (min !== undefined && value < min) errors[chave] = `${label} deve ser no mínimo ${min} ${UNIDADES_ATIVIDADE[unidade]}.`
    else if (max !== undefined && value > max) errors[chave] = `${label} deve ser no máximo ${max} ${UNIDADES_ATIVIDADE[unidade]}.`
    else valores[chave] = value
  }
  return { errors, valores }
}
