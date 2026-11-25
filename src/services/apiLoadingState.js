const SHOW_DELAY_MS = 180

let pendingRequests = 0
let visible = false
let showTimer = null
const subscribers = new Set()

function notify() {
  subscribers.forEach((subscriber) => subscriber())
}

export function subscribeToApiLoading(subscriber) {
  subscribers.add(subscriber)
  return () => subscribers.delete(subscriber)
}

export function getApiLoadingSnapshot() {
  return visible
}

export function beginApiRequest() {
  pendingRequests += 1
  if (pendingRequests !== 1) return

  showTimer = window.setTimeout(() => {
    showTimer = null
    if (pendingRequests === 0) return
    visible = true
    notify()
  }, SHOW_DELAY_MS)
}

export function endApiRequest() {
  pendingRequests = Math.max(0, pendingRequests - 1)
  if (pendingRequests > 0) return

  if (showTimer !== null) {
    window.clearTimeout(showTimer)
    showTimer = null
  }

  if (visible) {
    visible = false
    notify()
  }
}
