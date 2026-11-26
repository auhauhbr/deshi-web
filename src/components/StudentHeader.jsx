import AppHeader from './AppHeader.jsx'

function StudentHeader({ className = '', onEditProfile, children }) {
  return (
    <AppHeader className={className} fallbackLabel="Aluno" onEditProfile={onEditProfile}>
      {children}
    </AppHeader>
  )
}

export default StudentHeader
