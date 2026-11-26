import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredUser, logoutUser } from '../services/authService.js'
import { getTheme, setTheme } from '../services/themeService.js'
import './AccountMenu.css'

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('pt-BR')
}

function Icon({ name }) {
  const paths = {
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
    moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
    logout: <><path d="M10 17l5-5-5-5m5 5H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    chevron: <path d="m7 10 5 5 5-5" />,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4Z" /></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function AccountMenu({ fallbackLabel = 'Usuário', onEditProfile }) {
  const navigate = useNavigate()
  const user = getStoredUser() || {}
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [theme, setThemeState] = useState(getTheme)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const name = user.name || fallbackLabel
  const isStudent = user.profile === 'STUDENT' || fallbackLabel === 'Aluno'

  useEffect(() => {
    if (!isOpen) return undefined
    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false)
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

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
    <div className={`account-menu${isOpen ? ' is-open' : ''}`} ref={rootRef}>
      <button
        className="account-menu__avatar"
        type="button"
        ref={triggerRef}
        aria-label={`Abrir opções de ${name}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title="Opções da conta"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{initials(name) || 'U'}</span>
        <span className="account-menu__chevron"><Icon name="chevron" /></span>
      </button>

      {isOpen && (
        <div className="account-menu__panel" role="menu" aria-label="Opções da conta">
          <button
            className="account-menu__identity"
            type="button"
            role="menuitem"
            aria-label={`Abrir perfil de ${name}`}
            onClick={() => {
              setIsOpen(false)
              navigate(isStudent ? '/profile' : '/perfil')
            }}
          >
            <span className="account-menu__identity-avatar" aria-hidden="true">{initials(name) || 'U'}</span>
            <span className="account-menu__identity-copy">
              <span className="account-menu__name">{name}</span>
              {user.email && <span className="account-menu__email">{user.email}</span>}
            </span>
          </button>
          <div className="account-menu__divider" />

          {isStudent && <button
            className="account-menu__item"
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false)
              if (onEditProfile) onEditProfile()
              else navigate('/profile', { state: { openEditProfile: true } })
            }}
          >
            <Icon name="edit" />
            <span>Editar perfil</span>
          </button>}

          <button
            className="account-menu__item account-menu__item--theme"
            type="button"
            role="menuitem"
            aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
            aria-pressed={theme === 'dark'}
            onClick={() => setThemeState(setTheme(theme === 'dark' ? 'light' : 'dark'))}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            <span>{theme === 'dark' ? 'Tema claro' : 'Tema escuro'}</span>
          </button>

          <div className="account-menu__divider" />
          <button className="account-menu__item account-menu__item--logout" type="button" role="menuitem" onClick={handleLogout} disabled={isLoggingOut}>
            <Icon name="logout" />
            <span>{isLoggingOut ? 'Saindo...' : 'Sair da conta'}</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default AccountMenu
