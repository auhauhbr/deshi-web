import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredUser, logoutUser } from '../services/authService.js'
import './AccountMenu.css'

const enabledMenuItem = '[role="menuitem"]:not(:disabled)'

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('pt-BR')
}

function Icon({ name }) {
  const paths = {
    logout: <><path d="M10 17l5-5-5-5m5 5H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    chevron: <path d="m7 10 5 5 5-5" />,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4Z" /></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function AccountMenu({ fallbackLabel = 'Usuário', onEditProfile, editProfileTo }) {
  const navigate = useNavigate()
  const user = getStoredUser() || {}
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const focusLastOnOpen = useRef(false)
  const menuId = useId()
  const emailId = `${menuId}-email`
  const name = user.name || fallbackLabel
  const isStudent = user.profile === 'STUDENT' || fallbackLabel === 'Aluno'
  const profilePath = isStudent ? '/profile' : '/perfil'

  useEffect(() => {
    if (!isOpen) return undefined
    const items = rootRef.current.querySelectorAll(enabledMenuItem)
    items[focusLastOnOpen.current ? items.length - 1 : 0]?.focus()
    focusLastOnOpen.current = false

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen])

  function closeMenu() {
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  function handleMenuKeys(event) {
    const { key } = event
    if (!isOpen) {
      if (key === 'ArrowDown' || key === 'ArrowUp') {
        event.preventDefault()
        focusLastOnOpen.current = key === 'ArrowUp'
        setIsOpen(true)
      }
      return
    }

    if (key === 'Escape' || key === 'Tab') {
      if (key === 'Escape') event.preventDefault()
      closeMenu()
      return
    }

    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) return
    event.preventDefault()
    const items = [...rootRef.current.querySelectorAll(enabledMenuItem)]
    const current = items.indexOf(event.target)
    const last = items.length - 1
    let nextIndex = 0
    switch (key) {
      case 'End': nextIndex = last; break
      case 'ArrowDown': nextIndex = current < last ? current + 1 : 0; break
      case 'ArrowUp': nextIndex = current > 0 ? current - 1 : last; break
    }
    items[nextIndex]?.focus()
  }

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logoutUser()
    } catch {
      // logoutUser já removeu a sessão local.
    }
    navigate('/login', {
      replace: true,
      state: { message: 'Você saiu da sua conta com segurança.' },
    })
  }

  return (
    <div className={`account-menu${isOpen ? ' is-open' : ''}`} ref={rootRef} onKeyDown={handleMenuKeys} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false)
    }}>
      <button
        className="account-menu__avatar"
        type="button"
        ref={triggerRef}
        aria-label={`Abrir opções de ${name}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        title="Opções da conta"
        onClick={() => {
          if (isOpen) closeMenu()
          else setIsOpen(true)
        }}
      >
        <span>{initials(name) || 'U'}</span>
        <span className="account-menu__chevron"><Icon name="chevron" /></span>
      </button>

      {isOpen && (
        <div id={menuId} className="account-menu__panel" role="menu" aria-label="Opções da conta">
          <button
            className="account-menu__identity"
            type="button"
            role="menuitem"
            tabIndex={-1}
            aria-label={`Abrir perfil de ${name}`}
            aria-describedby={user.email ? emailId : undefined}
            onClick={() => {
              closeMenu()
              navigate(profilePath)
            }}
          >
            <span className="account-menu__identity-avatar" aria-hidden="true">{initials(name) || 'U'}</span>
            <span className="account-menu__identity-copy">
              <span className="account-menu__name">{name}</span>
              {user.email && <span id={emailId} className="account-menu__email">{user.email}</span>}
            </span>
          </button>
          {(isStudent || editProfileTo) && <>
            <div className="account-menu__divider" />
            <button
              className="account-menu__item"
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                closeMenu()
                if (onEditProfile) onEditProfile()
                else if (editProfileTo) navigate(editProfileTo)
                else navigate(profilePath, { state: { openEditProfile: true } })
              }}
            >
              <Icon name="edit" />
              <span>Editar perfil</span>
            </button>
          </>}

          <div className="account-menu__divider" />
          <button className="account-menu__item account-menu__item--logout" type="button" role="menuitem" tabIndex={-1} onClick={handleLogout} disabled={isLoggingOut}>
            <Icon name="logout" />
            <span>{isLoggingOut ? 'Saindo...' : 'Sair da conta'}</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default AccountMenu
