import { NavLink } from 'react-router-dom'
import { clearSession } from '../services/session'

export default function AppHeader({ user }) {
  return (
    <header className="app-header">
      {user?.profile === 'PROFESSIONAL' && (
        <NavLink className="header-home" to="/home">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" />
          </svg>
          <span>Início</span>
        </NavLink>
      )}
      {user ? (
        <div className="account">
          <span className="account-name">{user.name}</span>
          <button className="text-button" type="button" onClick={() => clearSession()}>Sair</button>
        </div>
      ) : <span className="header-label">Área profissional</span>}
    </header>
  )
}
