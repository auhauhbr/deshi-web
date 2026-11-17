import { NavLink } from 'react-router-dom'
import './ProfessionalNavigation.css'

const items = [
  { label: 'Início', path: '/home', icon: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></> },
  { label: 'Alunos', path: '/alunos', icon: <><circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0M18 8v6M15 11h6"/></> },
  { label: 'Biblioteca', path: '/biblioteca', icon: <><path d="M6 9v6M3.5 10.5v3M18 9v6M20.5 10.5v3M6 12h12"/><path d="M6 10H4.5A1.5 1.5 0 0 0 3 11.5v1A1.5 1.5 0 0 0 4.5 14H6M18 10h1.5a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5H18"/></> },
  { label: 'Perfil', path: null, icon: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></> },
]

function ProfessionalNavigation() {
  return <nav className="professional-nav" aria-label="Navegação principal">
    <div className="professional-nav__brand"><span className="professional-nav__brand-mark">D</span><span>DESHI</span></div>
    <div className="professional-nav__items">
      {items.map((item) => item.path ? <NavLink key={item.label} to={item.path} end={item.path === '/home'} className={({ isActive }) => `professional-nav__item${isActive ? ' is-active' : ''}`}>
        <svg viewBox="0 0 24 24" aria-hidden="true">{item.icon}</svg><span>{item.label}</span>
      </NavLink> : <button key={item.label} className="professional-nav__item" type="button" disabled title={`${item.label}: em breve`}>
        <svg viewBox="0 0 24 24" aria-hidden="true">{item.icon}</svg><span>{item.label}</span>
      </button>)}
    </div>
    <span className="professional-nav__caption">Seu treino, no seu ritmo.</span>
  </nav>
}

export default ProfessionalNavigation
