import { NavLink } from 'react-router-dom'
import './ProfessionalNavigation.css'

const items = [
  { label: 'Início', path: '/home', icon: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></> },
  { label: 'Alunos', path: null, icon: <><circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0M18 8v6M15 11h6"/></> },
  { label: 'Treinos', path: null, icon: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></> },
  { label: 'Perfil', path: null, icon: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></> },
]

function ProfessionalNavigation() {
  return <nav className="professional-nav" aria-label="Navegação principal">
    <div className="professional-nav__brand"><span className="professional-nav__brand-mark">D</span><span>DESHI</span></div>
    <div className="professional-nav__items">
      {items.map((item) => item.path ? <NavLink key={item.label} to={item.path} end className={({ isActive }) => `professional-nav__item${isActive ? ' is-active' : ''}`}>
        <svg viewBox="0 0 24 24" aria-hidden="true">{item.icon}</svg><span>{item.label}</span>
      </NavLink> : <button key={item.label} className="professional-nav__item" type="button" disabled title={`${item.label}: em breve`}>
        <svg viewBox="0 0 24 24" aria-hidden="true">{item.icon}</svg><span>{item.label}</span>
      </button>)}
    </div>
    <span className="professional-nav__caption">Seu treino, no seu ritmo.</span>
  </nav>
}

export default ProfessionalNavigation
