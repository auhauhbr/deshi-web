import { clearSession, getSessionSnapshot } from './session'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function errorMessage(data) {
  const message = data?.message ?? data?.error
  if (typeof message === 'string') return message
  if (Array.isArray(message)) return message.filter((item) => typeof item === 'string').join(' ')
  if (typeof message?.message === 'string') return message.message
  return null
}

export async function apiRequest(path, { method = 'GET', body, authenticated = true, signal } = {}) {
  const token = authenticated ? getSessionSnapshot().session?.token : null
  if (authenticated && !token) {
    clearSession('expired')
    throw new ApiError('Sua sessão expirou. Entre novamente.', 401)
  }

  const controller = new AbortController()
  const abort = () => controller.abort()
  signal?.addEventListener('abort', abort, { once: true })
  if (signal?.aborted) controller.abort()
  const timeout = setTimeout(abort, 15000)

  try {
    const response = await fetch(`/api${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    })

    if (authenticated && response.status === 401) {
      // A late response from an older session must not clear a newer login.
      if (getSessionSnapshot().session?.token === token) clearSession('expired')
      throw new ApiError('Sua sessão expirou. Entre novamente.', 401)
    }

    const text = await response.text()
    let data = null
    try { data = text ? JSON.parse(text) : null } catch { /* Handle non-JSON proxy errors below. */ }

    if (!response.ok) {
      const fallback = response.status === 401
        ? 'E-mail ou senha inválidos.'
        : response.status === 403
          ? 'Seu perfil não tem permissão para esta ação.'
          : response.status === 400
            ? 'Confira os dados informados e tente novamente.'
            : response.status >= 500 && !data
              ? 'Não foi possível conectar ao servidor.'
              : 'Não foi possível concluir a solicitação. Tente novamente.'
      const plainMessage = response.status >= 400 && response.status < 500 &&
        response.headers.get('content-type')?.includes('text/plain') ? text.trim() : null
      throw new ApiError(errorMessage(data) || plainMessage || fallback, response.status)
    }

    if (text && data === null) throw new ApiError('O servidor retornou uma resposta inválida. Tente novamente.', response.status)
    return data
  } catch (error) {
    if (signal?.aborted || error instanceof ApiError) throw error
    throw new ApiError('Não foi possível conectar ao servidor. Tente novamente.', 0)
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abort)
  }
}
