import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredUser, logoutUser } from '../services/authService.js'
import './AccountMenu.css'

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('pt-BR')
}

function Icon({ name }) {
  const paths = {
    user: <><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="8" r="4" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
    logout: <><path d="M10 17l5-5-5-5m5 5H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    chevron: <path d="m7 10 5 5 5-5" />,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function AccountMenu({ fallbackLabel = 'Usuário' }) {
  const navigate = useNavigate()
  const user = getStoredUser() || {}
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
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
          <div className="account-menu__identity">
            <span className="account-menu__identity-avatar" aria-hidden="true">{initials(name) || 'U'}</span>
            <span className="account-menu__identity-copy">
              <span className="account-menu__name">{name}</span>
              {user.email && <span className="account-menu__email">{user.email}</span>}
            </span>
          </div>
          <div className="account-menu__divider" />

          <button
            className="account-menu__item"
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false)
              navigate(isStudent ? '/profile' : '/perfil')
            }}
          >
            <Icon name="user" />
            <span>Meu perfil</span>
          </button>

          <button
            className="account-menu__item account-menu__item--theme"
            type="button"
            role="menuitem"
            disabled
            aria-label="Tema. Disponível em breve."
            title="Alternância de tema disponível em breve"
          >
            <Icon name="sun" />
            <span>Tema</span>
            <span className="account-menu__soon">Em breve</span>
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
