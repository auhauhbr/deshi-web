import { createPortal } from 'react-dom'
import AccountMenu from './AccountMenu.jsx'
import './StudentAccountMenu.css'

function StudentAccountMenu() {
  return createPortal(
    <div className="student-account-menu">
      <AccountMenu fallbackLabel="Aluno" />
    </div>,
    document.body,
  )
}

export default StudentAccountMenu
