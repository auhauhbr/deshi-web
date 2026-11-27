import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/auth.css'
import BrandLogo from './BrandLogo.jsx'
import Grainient from './Grainient.jsx'

const desktopGradientColors = ['#111d20', '#0c493d', '#31d883']
const mobileGradientColors = ['#ffffff', '#e7f5ee']

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
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 780px)').matches
  ))

  useEffect(() => {
    const media = window.matchMedia('(max-width: 780px)')
    const updateViewport = () => setIsMobile(media.matches)
    updateViewport()
    media.addEventListener('change', updateViewport)
    return () => media.removeEventListener('change', updateViewport)
  }, [])

  return (
    <main className={`auth-page ${pageClassName}`}>
      <aside className="auth-introduction" aria-label="Sobre o Deshi">
        {!isMobile && (
          <div className="auth-grainient auth-grainient-desktop" aria-hidden="true">
            <Grainient
              colors={desktopGradientColors}
              type="linear"
              angle={145}
              speed={0.78}
              flow={0.48}
              softness={0.88}
              silk={0.12}
              grainAmount={0.035}
              grainAnimated
              interactive
              clickSwirl={false}
              intro={false}
              lightMode={false}
              dpr={1.25}
              className="auth-grainient-canvas"
            />
          </div>
        )}
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
        {isMobile && (
          <div className="auth-grainient auth-grainient-mobile" aria-hidden="true">
            <Grainient
              colors={mobileGradientColors}
              type="linear"
              angle={180}
              speed={0.58}
              flow={0.34}
              softness={0.92}
              silk={0.08}
              grainAmount={0.025}
              grainAnimated
              interactive
              clickSwirl={false}
              intro={false}
              lightMode={false}
              dpr={1.25}
              className="auth-grainient-canvas"
            />
          </div>
        )}
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
