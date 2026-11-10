import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StudentBottomNav from '../../components/StudentBottomNav.jsx'
import BrandLogo from '../../components/BrandLogo.jsx'
import { getStoredUser, logoutUser } from '../../services/authService.js'
import '../Home/Home.css'
import './Profile.css'

function ProfilePage() {
  const navigate = useNavigate()
  const user = getStoredUser()
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
    <main className="start-session-page profile-page">
      <header className="session-header">
        <div className="session-brand">
          <BrandLogo className="session-brand-logo" />
        </div>
        <span className="session-header-label">Minha conta</span>
      </header>

      <section className="session-details-content">
        <div className="session-heading">
          <p className="session-eyebrow">SUA CONTA</p>
          <h1>Perfil</h1>
          <p>Confira as informações da sua conta.</p>
        </div>

        <section className="session-details-card profile-card" aria-label="Informações do perfil">
          <div className="profile-avatar" aria-hidden="true">
            {user?.name?.trim()?.charAt(0)?.toLocaleUpperCase('pt-BR') || '•'}
          </div>
          {user ? (
            <dl className="profile-information">
              <div><dt>Nome</dt><dd>{user.name || 'Não informado'}</dd></div>
              <div><dt>E-mail</dt><dd>{user.email || 'Não informado'}</dd></div>
              <div><dt>Perfil</dt><dd>{user.profile === 'STUDENT' ? 'Aluno' : user.profile === 'PROFESSIONAL' ? 'Profissional' : 'Não informado'}</dd></div>
            </dl>
          ) : (
            <p className="profile-unavailable">As informações do perfil não estão disponíveis nesta sessão. Entre novamente para carregá-las.</p>
          )}
          <button type="button" className="home-logout profile-logout" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? 'Saindo...' : 'Sair da conta'}
          </button>
        </section>
      </section>

      <StudentBottomNav active="profile" />
    </main>
  )
}

export default ProfilePage
