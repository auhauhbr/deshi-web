import { Navigate, Outlet } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import AppHeader from './AppHeader'
import { clearSession } from '../services/session'

export default function ProfessionalRoute() {
  const { session } = useSession()
  if (!session) return <Navigate to="/login" replace />

  if (session.user.profile !== 'PROFESSIONAL') {
    return (
      <div className="app-shell">
        <AppHeader user={session.user} />
        <main className="panel restricted-panel">
          <span className="eyebrow">Área profissional</span>
          <h1>Acesso restrito</h1>
          <p>Esta área está disponível apenas para profissionais. Entre com uma conta de profissional para definir suas modalidades.</p>
          <button className="primary-button" type="button" onClick={() => clearSession()}>Sair da sessão</button>
        </main>
      </div>
    )
  }

  return <Outlet />
}
