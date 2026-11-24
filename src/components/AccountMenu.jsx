import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredUser, logoutUser } from '../services/authService.js'
import './AccountMenu.css'

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('pt-BR')
}

function AccountMenu({ fallbackLabel = 'Usuário' }) {
  const navigate = useNavigate()
  const user = getStoredUser() || {}
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
    <details className="account-menu">
      <summary className="account-menu__avatar" aria-label={`Abrir opções de ${user.name || fallbackLabel}`} title="Opções da conta">
        {initials(user.name || fallbackLabel) || 'U'}
        <span className="account-menu__chevron" aria-hidden="true">⌄</span>
      </summary>
      <div className="account-menu__panel">
        <span className="account-menu__name">{user.name || fallbackLabel}</span>
        {user.email && <span className="account-menu__email">{user.email}</span>}
        <button type="button" onClick={handleLogout} disabled={isLoggingOut}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3m9-7h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7" /></svg>
          {isLoggingOut ? 'Saindo...' : 'Sair da conta'}
        </button>
      </div>
    </details>
  )
}

export default AccountMenu
