import { NavLink, useLocation } from 'react-router-dom'
import './StudentBottomNav.css'

function StudentBottomNav({ active }) {
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
    <nav className="student-bottom-nav" aria-label="Navegação principal">
      <NavLink to="/home" className={current === 'home' ? 'active' : ''} aria-current={current === 'home' ? 'page' : undefined}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1z" /></svg>
        <span>Home</span>
      </NavLink>
      <NavLink to="/sessions/start" className={current === 'todo' ? 'active' : ''} aria-current={current === 'todo' ? 'page' : undefined}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14M18 5v14M3 8h6m6 8h6M9 12h6" /></svg>
        <span>Treinos a fazer</span>
      </NavLink>
      <NavLink to="/sessions/completed" className={current === 'completed' ? 'active' : ''} aria-current={current === 'completed' ? 'page' : undefined}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></svg>
        <span>Treinos concluídos</span>
      </NavLink>
      <NavLink to="/profile" className={current === 'profile' ? 'active' : ''} aria-current={current === 'profile' ? 'page' : undefined}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>
        <span>Perfil</span>
      </NavLink>
    </nav>
  )
}

export default StudentBottomNav
