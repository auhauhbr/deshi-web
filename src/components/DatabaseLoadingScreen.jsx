import { useSyncExternalStore } from 'react'
import BrandLogo from './BrandLogo.jsx'
import { getApiLoadingSnapshot, subscribeToApiLoading } from '../services/apiLoadingState.js'
import './DatabaseLoadingScreen.css'

export default function DatabaseLoadingScreen() {
  const isVisible = useSyncExternalStore(subscribeToApiLoading, getApiLoadingSnapshot, () => false)

  if (!isVisible) return null

  return (
    <div className="database-loading-screen" role="status" aria-live="polite" aria-label="Carregando dados">
      <BrandLogo className="database-loading-screen__logo" variant="dark" />
      <div className="database-loading-screen__loader" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}
