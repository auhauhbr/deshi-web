import { Link } from 'react-router-dom'
import '../styles/auth.css'
import BrandLogo from './BrandLogo.jsx'

function AuthLayout({ children, footerLink, footerLinkText, footerText, pageClassName, subtitle, title }) {
  return (
    <main className={`auth-page ${pageClassName}`}>
      <section className="auth-introduction" aria-label="Apresentação do Deshi">
        <Link className="brand" to="/login" aria-label="Deshi - ir para login"><BrandLogo className="auth-brand-logo" variant="dark" /></Link>
        <div className="introduction-content"><p className="eyebrow">Gestão esportiva sem complicação</p><h1>O seu treino merece uma rotina mais simples.</h1><p>Organize alunos, programas e resultados em um só lugar.</p></div>
        <p className="introduction-note">Feito para profissionais e alunos.</p>
      </section>
      <section className="auth-content"><div className="auth-card">
        <Link className="brand brand-mobile" to="/login" aria-label="Deshi - ir para login"><BrandLogo className="auth-brand-logo" /></Link>
        <header><h2>{title}</h2><p>{subtitle}</p></header>
        {children}
        <p className="auth-footer">{footerText} <Link to={footerLink}>{footerLinkText}</Link></p>
      </div></section>
    </main>
  )
}

export default AuthLayout
