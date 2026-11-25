import { Link } from 'react-router-dom'
import '../styles/auth.css'
import BrandLogo from './BrandLogo.jsx'

function AuthLayout({
  children,
  footerLink,
  footerLinkText,
  footerText,
  introDescription,
  introFooter,
  introTitle,
  pageClassName,
  subtitle,
  title,
}) {
  return (
    <main className={`auth-page ${pageClassName}`}>
      <aside className="auth-introduction" aria-label="Sobre o Deshi">
        <Link className="brand" to="/" aria-label="Voltar para a página inicial do Deshi">
          <BrandLogo className="auth-brand-logo" variant="dark" />
        </Link>
        <div className="introduction-content">
          <h1>{introTitle}</h1>
          <p>{introDescription}</p>
          <ul className="auth-practice-list">
            <li><span>Profissional</span><strong>Organiza alunos e monta programas.</strong></li>
            <li><span>Aluno</span><strong>Consulta o treino e registra a execução.</strong></li>
          </ul>
        </div>
        <p className="introduction-note">{introFooter}</p>
      </aside>

      <section className="auth-content">
        <div className="auth-card">
          <Link className="brand brand-mobile" to="/" aria-label="Voltar para a página inicial do Deshi">
            <BrandLogo className="auth-brand-logo" />
          </Link>
          <header>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </header>
          {children}
          <p className="auth-footer">{footerText} <Link to={footerLink}>{footerLinkText}</Link></p>
        </div>
      </section>
    </main>
  )
}

export default AuthLayout
