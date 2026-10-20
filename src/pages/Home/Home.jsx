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
        <p className="home-eyebrow">Login realizado</p>
        <h1>Você está na home.</h1>
        <p>Esta é uma tela inicial temporária para confirmar que a autenticação funcionou.</p>
        <button type="button" className="home-logout" onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? 'Saindo...' : 'Sair da conta'}
        </button>
      </section>
    </main>
  )
}

export default HomePage
