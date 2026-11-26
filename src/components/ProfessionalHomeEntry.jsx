import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../services/api.js'
import { getApiErrorMessage } from '../services/authService.js'
import { resumeApiLoadingScreen } from '../services/apiLoadingState.js'
import ProfessionalHomePage from '../pages/ProfessionalHome/ProfessionalHome.jsx'
import './ProfessionalHomeEntry.css'

function ProfessionalHomeEntry() {
  const location = useLocation()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const [isLoginRevealVisible, setIsLoginRevealVisible] = useState(() => (
    Boolean(location.state?.playLoginReveal)
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ))
  const [status, setStatus] = useState({ loading: true, hasModalities: false, error: '' })
  const [attempt, setAttempt] = useState(0)

  function finishLoginReveal() {
    setIsLoginRevealVisible(false)
    resumeApiLoadingScreen()
  }

  useEffect(() => {
    if (location.state?.playLoginReveal && !isLoginRevealVisible) resumeApiLoadingScreen()
  }, [isLoginRevealVisible, location.state])

  useEffect(() => {
    if (!location.state?.playLoginReveal) return
    navigate('/home', { replace: true, state: { profile: location.state.profile } })
  }, [location.state, navigate])

  useEffect(() => {
    if (!isLoginRevealVisible) return undefined

    function skipOnEscape(event) {
      if (event.key === 'Escape') finishLoginReveal()
    }

    window.addEventListener('keydown', skipOnEscape)
    videoRef.current?.play()?.catch(finishLoginReveal)
    return () => window.removeEventListener('keydown', skipOnEscape)
  }, [isLoginRevealVisible])

  useEffect(() => {
    const controller = new AbortController()
    api.get('/modalidades/minhas', { signal: controller.signal })
      .then(({ data }) => setStatus({ loading: false, hasModalities: Array.isArray(data) && data.length > 0, error: '' }))
      .catch((error) => {
        if (!controller.signal.aborted) setStatus({ loading: false, hasModalities: false, error: getApiErrorMessage(error, 'Não foi possível verificar sua configuração.') })
      })
    return () => controller.abort()
  }, [attempt])

  if (!status.loading && !status.error && !status.hasModalities) return <Navigate to="/modalidades" replace />

  let pageContent
  if (status.loading) pageContent = <main className="professional-entry" role="status"><span className="professional-entry__spinner" aria-hidden="true" />Preparando sua área profissional…</main>
  else if (status.error) pageContent = <main className="professional-entry"><section className="professional-entry__panel"><h1>Não foi possível abrir seu painel</h1><p>{status.error}</p><button type="button" onClick={() => { setStatus({ loading: true, hasModalities: false, error: '' }); setAttempt((value) => value + 1) }}>Tentar novamente</button></section></main>
  else pageContent = <ProfessionalHomePage />
  return <>
    {pageContent}
    {isLoginRevealVisible && (
      <div className="login-transition-overlay" role="status" aria-label="Animação de entrada do Deshi">
        <div className="login-transition-crop">
          <video
            ref={videoRef}
            className="login-transition-video"
            src="/login-transition.mp4"
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={finishLoginReveal}
            onError={finishLoginReveal}
          />
        </div>
      </div>
    )}
  </>
}

export default ProfessionalHomeEntry
