import { api } from './api.js'
import { getApiErrorMessage } from './authService.js'

const BODY_METRICS_PATH = '/users/me/body-metrics'

function normalizeBodyMetrics(data) {
  if (data == null) return null
  if (typeof data.weightKg !== 'number' || typeof data.heightCm !== 'number' ||
    typeof data.bmi !== 'number' || typeof data.updatedAt !== 'string') {
    throw new Error('Não foi possível ler suas medidas. Tente novamente.')
  }
  const history = Array.isArray(data.history)
    ? data.history.filter((item) => typeof item.weightKg === 'number' && typeof item.recordedAt === 'string')
    : [{ id: 'current', weightKg: data.weightKg, heightCm: data.heightCm, bmi: data.bmi, recordedAt: data.updatedAt }]
  return { ...data, history }
}

export async function getStudentBodyMetrics(signal) {
  try {
    const { data } = await api.get(BODY_METRICS_PATH, { signal })
    return normalizeBodyMetrics(data)
  } catch (error) {
    const failure = new Error(getApiErrorMessage(error, 'Não foi possível carregar suas medidas.'))
    failure.status = error.response?.status
    throw failure
  }
}

export async function saveStudentBodyMetrics({ weightKg, heightCm }, signal) {
  try {
    const { data } = await api.put(BODY_METRICS_PATH, { weightKg, heightCm }, { signal })
    return normalizeBodyMetrics(data)
  } catch (error) {
    const failure = new Error(getApiErrorMessage(error, 'Não foi possível salvar suas medidas.'))
    failure.status = error.response?.status
    throw failure
  }
}
