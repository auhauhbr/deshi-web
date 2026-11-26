import BrandLogo from './BrandLogo.jsx'
import ThemeSwitch from './ThemeSwitch.jsx'
import AccountMenu from './AccountMenu.jsx'
import './StudentHeader.css'

function StudentHeader({ className = '', onEditProfile, children }) {
  const headerClassName = ['session-header', 'student-header', className].filter(Boolean).join(' ')

  return (
    <header className={headerClassName}>
      <div className="session-brand">
        <BrandLogo className="session-brand-logo" variant="adaptive" to="/home" />
      </div>
      {children}
      <div className="student-header-actions" aria-label="Ações da conta">
        <ThemeSwitch />
        <AccountMenu fallbackLabel="Aluno" onEditProfile={onEditProfile} />
      </div>
    </header>
  )
}

export default StudentHeader
