import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { logoutUser } from '../../services/authService.js'
import StudentBottomNav from '../../components/StudentBottomNav.jsx'
import BrandLogo from '../../components/BrandLogo.jsx'
import './Home.css'

const FitnessScene = lazy(() => import('../../components/FitnessScene.jsx'))

function HomePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isLoginRevealVisible, setIsLoginRevealVisible] = useState(() => (
    Boolean(location.state?.playLoginReveal)
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ))

  useEffect(() => {
    if (!location.state?.playLoginReveal) return
    navigate('/home', {
      replace: true,
      state: { profile: location.state.profile },
    })
  }, [location.state, navigate])

  useEffect(() => {
    if (!isLoginRevealVisible) return undefined

    function skipOnEscape(event) {
      if (event.key === 'Escape') setIsLoginRevealVisible(false)
    }

    window.addEventListener('keydown', skipOnEscape)
    const playPromise = videoRef.current?.play()
    playPromise?.catch(() => setIsLoginRevealVisible(false))

    return () => window.removeEventListener('keydown', skipOnEscape)
  }, [isLoginRevealVisible])

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logoutUser()
    } finally {
      navigate('/login', {
        replace: true,
        state: { message: 'Você saiu da sua conta com segurança.' },
      })
    }
  }

  return (
    <main className="home-page">
      <header className="home-header">
        <div className="session-brand">
          <BrandLogo className="session-brand-logo" />
        </div>
        <span className="session-header-label">Área do aluno</span>
      </header>
      <section className="home-content">
        <div className="home-card">
          <div className="home-copy">
            <p className="home-eyebrow">SUA ROTINA ESPORTIVA</p>
            <h1>Pronto para treinar?</h1>
            <p>Acesse seus programas e inicie uma sessão de treino.</p>
            <button type="button" className="home-start-session" onClick={() => navigate('/sessions/start')}>
              Iniciar sessão <span aria-hidden="true">→</span>
            </button>
          </div>
          <div className="home-visual">
            <div className="home-visual-orbit home-visual-orbit-outer" />
            <div className="home-visual-orbit home-visual-orbit-inner" />
            <Suspense fallback={<div className="fitness-scene-loading" aria-hidden="true" />}>
              <FitnessScene />
            </Suspense>
          </div>
        </div>
      </section>
      <StudentBottomNav active="home" />
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
              onEnded={() => setIsLoginRevealVisible(false)}
              onError={() => setIsLoginRevealVisible(false)}
            />
          </div>
        </div>
      )}
    </main>
  )
}

export default HomePage
