import { clearSession } from '../services/session'

export default function AppHeader({ user }) {
  return (
    <header className="app-header">
      {user ? (
        <div className="account">
          <span className="account-name">{user.name}</span>
          <button className="text-button" type="button" onClick={() => clearSession()}>Sair</button>
        </div>
      ) : <span className="header-label">Área profissional</span>}
    </header>
  )
}
