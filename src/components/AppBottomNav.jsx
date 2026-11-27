import { NavLink, useLocation } from 'react-router-dom'
import { getStoredUser } from '../services/authService.js'
import './AppBottomNav.css'

const studentItems = [
  {
    key: 'completed', label: 'Histórico', path: '/sessions/completed',
    icon: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
  },
  {
    key: 'todo', label: 'Treinos', path: '/sessions/start',
    icon: <path d="M6 5v14M18 5v14M3 8h6m6 8h6M9 12h6" />,
  },
  {
    key: 'home', label: 'Home', path: '/home',
    icon: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1z" />,
  },
  {
    key: 'invite', label: 'Vínculos', path: '/invites/accept',
    icon: <><path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6z" /><path d="M13 7v2m0 3v2m0 3v1" /></>,
  },
  {
    key: 'profile', label: 'Perfil', path: '/profile',
    icon: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  },
]

const professionalItems = [
  {
    key: 'home', label: 'Início', path: '/home',
    icon: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
  },
  {
    key: 'students', label: 'Alunos', path: '/alunos',
    icon: <><circle cx="9" cy="8" r="3.5" /><path d="M2 20a7 7 0 0 1 14 0M18 8v6M15 11h6" /></>,
  },
  {
    key: 'library', label: 'Biblioteca', path: '/biblioteca',
    icon: <><path d="M6 9v6M3.5 10.5v3M18 9v6M20.5 10.5v3M6 12h12" /><path d="M6 10H4.5A1.5 1.5 0 0 0 3 11.5v1A1.5 1.5 0 0 0 4.5 14H6M18 10h1.5a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5H18" /></>,
  },
  {
    key: 'profile', label: 'Perfil', path: '/perfil',
    icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  },
]

function inferStudentSection(pathname) {
  if (pathname.startsWith('/sessions/completed')) return 'completed'
  if (pathname.startsWith('/sessions/')) return 'todo'
  if (pathname.startsWith('/invites/')) return 'invite'
  if (pathname.startsWith('/profile')) return 'profile'
  return 'home'
}

function inferProfessionalSection(pathname) {
  if (pathname.startsWith('/alunos')) return 'students'
  if (pathname.startsWith('/biblioteca') || pathname.startsWith('/atividades')) return 'library'
  if (pathname.startsWith('/perfil') || pathname.startsWith('/modalidades')) return 'profile'
  return 'home'
}

function AppBottomNav({ active }) {
  const { pathname } = useLocation()
  const isProfessional = getStoredUser()?.profile === 'PROFESSIONAL'
  const items = isProfessional ? professionalItems : studentItems
  const current = active || (isProfessional ? inferProfessionalSection(pathname) : inferStudentSection(pathname))

  return (
    <nav className="app-bottom-nav" aria-label="Navegação principal" style={{ '--app-nav-item-count': items.length }}>
      <div className="app-bottom-nav__items">
        {items.map((item) => {
          const isActive = current === item.key
          return (
            <NavLink
              key={item.key}
              title={item.label}
              to={item.path}
              end={item.path === '/home'}
              className={`app-bottom-nav__link${isActive ? ' is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="app-bottom-nav__icon"><svg viewBox="0 0 24 24" aria-hidden="true">{item.icon}</svg></span>
              <span className="app-bottom-nav__label">{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export default AppBottomNav
