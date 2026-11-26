import { Outlet, useLocation } from 'react-router-dom'
import AppHeader from './AppHeader.jsx'
import ProfessionalNavigation from './ProfessionalNavigation.jsx'
import './ProfessionalLayout.css'

export default function ProfessionalLayout({ children }) {
  const { key } = useLocation()

  return (
    <div className="professional-layout">
      <AppHeader key={key} className="professional-header" fallbackLabel="Profissional" editProfileTo="/perfil#profile-modalities-title" />
      <ProfessionalNavigation />
      <div className="professional-layout__content">{children ?? <Outlet />}</div>
    </div>
  )
}
