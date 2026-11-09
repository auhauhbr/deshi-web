import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logoutUser } from '../../services/authService.js'
import './Home.css'

function HomePage() {
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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
      <section className="home-card">
        <span className="home-icon" aria-hidden="true">✓</span>
        <p className="home-eyebrow">Área do aluno</p>
        <h1>Pronto para treinar?</h1>
        <p>Acesse seus programas e inicie uma sessão de treino.</p>
        <button type="button" className="home-start-session" onClick={() => navigate('/sessions/start')}>
          Iniciar sessão <span aria-hidden="true">→</span>
        </button>
        <button type="button" className="home-logout" onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? 'Saindo...' : 'Sair da conta'}
        </button>
      </section>
    </main>
  )
}

export default HomePage
