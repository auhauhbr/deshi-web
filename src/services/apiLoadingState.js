let pendingRequests = 0
let visible = false
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
  if (visible) return
  visible = true
  notify()
}

export function endApiRequest() {
  pendingRequests = Math.max(0, pendingRequests - 1)
  if (pendingRequests > 0 || !visible) return
  visible = false
  notify()
}
