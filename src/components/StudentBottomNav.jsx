import { NavLink, useLocation } from 'react-router-dom'
import StudentAccountMenu from './StudentAccountMenu.jsx'
import './StudentBottomNav.css'

function StudentBottomNav({ active, showAccountMenu = true }) {
  const location = useLocation()
  const current = active || (
    location.pathname === '/home'
      ? 'home'
      : location.pathname === '/sessions/completed'
        ? 'completed'
        : location.pathname === '/profile'
          ? 'profile'
        : 'todo'
  )

  return (
    <>
      {showAccountMenu && <StudentAccountMenu />}
      <nav className="student-bottom-nav" aria-label="Navegação principal">
        <NavLink title="Home" to="/home" className={current === 'home' ? 'active' : ''} aria-current={current === 'home' ? 'page' : undefined}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1z" /></svg>
          <span>Home</span>
        </NavLink>
        <NavLink title="Treinos a fazer" to="/sessions/start" className={current === 'todo' ? 'active' : ''} aria-current={current === 'todo' ? 'page' : undefined}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14M18 5v14M3 8h6m6 8h6M9 12h6" /></svg>
          <span>Treinos a fazer</span>
        </NavLink>
        <NavLink title="Histórico de treinos" to="/sessions/completed" className={current === 'completed' ? 'active' : ''} aria-current={current === 'completed' ? 'page' : undefined}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></svg>
          <span>Histórico</span>
        </NavLink>
        <NavLink title="Vincular profissional" to="/invites/accept" className={current === 'invite' ? 'active' : ''} aria-current={current === 'invite' ? 'page' : undefined}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6z" /><path d="M13 7v2m0 3v2m0 3v1" /></svg>
          <span>Vincular profissional</span>
        </NavLink>
        <NavLink title="Perfil" to="/profile" className={current === 'profile' ? 'active' : ''} aria-current={current === 'profile' ? 'page' : undefined}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>
          <span>Perfil</span>
        </NavLink>
      </nav>
    </>
  )
}

export default StudentBottomNav
