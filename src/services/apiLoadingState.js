let pendingRequests = 0
let visible = false
let suppressionCount = 0
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

function syncVisibility() {
  const shouldBeVisible = pendingRequests > 0 && suppressionCount === 0
  if (visible === shouldBeVisible) return
  visible = shouldBeVisible
  notify()
}

export function beginApiRequest() {
  pendingRequests += 1
  syncVisibility()
}

export function endApiRequest() {
  pendingRequests = Math.max(0, pendingRequests - 1)
  syncVisibility()
}

export function suppressApiLoadingScreen() {
  suppressionCount += 1
  syncVisibility()
}

export function resumeApiLoadingScreen() {
  suppressionCount = Math.max(0, suppressionCount - 1)
  syncVisibility()
}
