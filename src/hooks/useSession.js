import { useSyncExternalStore } from 'react'
import { getSessionSnapshot, subscribeSession } from '../services/session'

export function useSession() {
  return useSyncExternalStore(subscribeSession, getSessionSnapshot)
}
