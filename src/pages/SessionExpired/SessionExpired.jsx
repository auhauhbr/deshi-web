import { useNavigate } from 'react-router-dom'
import BrandLogo from '../../components/BrandLogo.jsx'
import './SessionExpired.css'

function SessionExpiredPage() {
  const navigate = useNavigate()

  function goToLogin() {
    navigate('/login', {
      replace: true,
      state: { message: 'Sua sessão expirou. Entre novamente para continuar.' },
    })
  }

  return (
    <main className="session-expired-page">
      <section className="session-expired-card" aria-labelledby="session-expired-title">
        <BrandLogo className="session-expired-logo" variant="adaptive" />
        <div className="session-expired-icon" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="19" />
            <path d="M24 13v12l8 5" />
          </svg>
        </div>
        <p className="session-expired-eyebrow">Acesso encerrado</p>
        <h1 id="session-expired-title">Sua sessão expirou</h1>
        <p className="session-expired-copy">
          Por segurança, seu acesso foi encerrado. Entre novamente para continuar usando o DESHI.
        </p>
        <button className="session-expired-button" type="button" onClick={goToLogin}>
          Ir para o login
        </button>
      </section>
    </main>
  )
}

export default SessionExpiredPage
