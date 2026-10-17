const STORAGE_KEY = 'deshi_session'
const listeners = new Set()

function isSession(value) {
  return typeof value?.token === 'string' && value.token.length > 0 &&
    typeof value.user?.id === 'string' &&
    typeof value.user?.name === 'string' &&
    typeof value.user?.email === 'string' &&
    typeof value.user?.profile === 'string'
}

function readSession() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (isSession(stored)) return stored
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Invalid or unavailable storage must not prevent opening the login page.
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* Storage unavailable. */ }
  }
  return null
}

let snapshot = { session: readSession(), reason: null }

function publish(session, reason = null) {
  snapshot = { session, reason }
  listeners.forEach((listener) => listener())
}

export function getSessionSnapshot() {
  return snapshot
}

export function subscribeSession(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function saveSession(value) {
  if (!isSession(value)) throw new Error('O servidor retornou uma sessão inválida. Tente novamente.')
  const { id, name, email, profile } = value.user
  const session = { token: value.token, user: { id, name, email, profile } }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    throw new Error('Não foi possível guardar sua sessão. Permita o armazenamento local no navegador e tente novamente.')
  }
  publish(session)
}

export function clearSession(reason = null) {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* Clear memory even without storage. */ }
  publish(null, reason)
}

window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY || event.key === null) publish(readSession())
})
