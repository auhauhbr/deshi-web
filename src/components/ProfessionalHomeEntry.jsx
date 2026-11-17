import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../services/api.js'
import { getApiErrorMessage } from '../services/authService.js'
import ProfessionalHomePage from '../pages/ProfessionalHome/ProfessionalHome.jsx'
import './ProfessionalHomeEntry.css'

function ProfessionalHomeEntry() {
  const [status, setStatus] = useState({ loading: true, hasModalities: false, error: '' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    api.get('/modalidades/minhas', { signal: controller.signal })
      .then(({ data }) => setStatus({ loading: false, hasModalities: Array.isArray(data) && data.length > 0, error: '' }))
      .catch((error) => {
        if (!controller.signal.aborted) setStatus({ loading: false, hasModalities: false, error: getApiErrorMessage(error, 'Não foi possível verificar sua configuração.') })
      })
    return () => controller.abort()
  }, [attempt])

  if (status.loading) return <main className="professional-entry" role="status"><span className="professional-entry__spinner" aria-hidden="true" />Preparando sua área profissional…</main>
  if (status.error) return <main className="professional-entry"><section className="professional-entry__panel"><h1>Não foi possível abrir seu painel</h1><p>{status.error}</p><button type="button" onClick={() => { setStatus({ loading: true, hasModalities: false, error: '' }); setAttempt((value) => value + 1) }}>Tentar novamente</button></section></main>
  if (!status.hasModalities) return <Navigate to="/modalidades" replace />
  return <ProfessionalHomePage />
}

export default ProfessionalHomeEntry
