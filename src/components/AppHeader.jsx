import AccountMenu from './AccountMenu.jsx'
import BrandLogo from './BrandLogo.jsx'
import ThemeSwitch from './ThemeSwitch.jsx'
import './AppHeader.css'

export default function AppHeader({ className = '', children, ...accountMenuProps }) {
  const headerClassName = ['session-header', 'app-header', className].filter(Boolean).join(' ')

  return (
    <header className={headerClassName}>
      <div className="session-brand">
        <BrandLogo className="session-brand-logo" variant="adaptive" to="/home" />
      </div>
      {children}
      <div className="app-header-actions" role="group" aria-label="Ações da conta">
        <ThemeSwitch />
        <AccountMenu {...accountMenuProps} />
      </div>
    </header>
  )
}
