import { createPortal } from 'react-dom'
import AccountMenu from './AccountMenu.jsx'
import ThemeSwitch from './ThemeSwitch.jsx'
import './StudentAccountMenu.css'

function StudentAccountMenu({ onEditProfile }) {
  return createPortal(
    <div className="student-account-menu">
      <ThemeSwitch />
      <AccountMenu fallbackLabel="Aluno" onEditProfile={onEditProfile} />
    </div>,
    document.body,
  )
}

export default StudentAccountMenu
