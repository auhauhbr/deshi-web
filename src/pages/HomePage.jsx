import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { useSession } from '../hooks/useSession'
import './HomePage.css'

export default function HomePage() {
  const { session } = useSession()
  const firstName = session.user.name.trim().split(/\s+/)[0]

  return (
    <div className="app-shell home-shell">
      <AppHeader user={session.user} />
      <main className="home-main">
        <section className="home-welcome" aria-labelledby="home-title">
          <span className="home-eyebrow">Seu espaço profissional</span>
          <h1 id="home-title">{firstName ? `Olá, ${firstName}!` : 'Olá!'}</h1>
          <p>Suas modalidades e atividades, em um só lugar.</p>
        </section>

        <nav className="home-shortcuts" aria-labelledby="home-shortcuts-title">
          <div className="home-section-heading">
            <h2 id="home-shortcuts-title">Por onde vamos começar?</h2>
            <p>Acesse as ferramentas do seu dia a dia.</p>
          </div>
          <div className="home-card-grid">
            <Link className="home-card" to="/modalidades" aria-labelledby="home-modalidades-title" aria-describedby="home-modalidades-description">
              <span className="home-card-top" aria-hidden="true">
                <svg className="home-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
                  <rect x="4" y="4" width="6" height="6" rx="1" />
                  <rect x="14" y="4" width="6" height="6" rx="1" />
                  <rect x="4" y="14" width="6" height="6" rx="1" />
                  <rect x="14" y="14" width="6" height="6" rx="1" />
                </svg>
                <svg className="home-card-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </span>
              <h3 id="home-modalidades-title">Modalidades</h3>
              <p id="home-modalidades-description">Atualize as modalidades em que você atua.</p>
            </Link>

            <Link className="home-card" to="/atividades" aria-labelledby="home-atividades-title" aria-describedby="home-atividades-description">
              <span className="home-card-top" aria-hidden="true">
                <svg className="home-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 4v16M11 4v16M16 5l4 14" />
                </svg>
                <svg className="home-card-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </span>
              <h3 id="home-atividades-title">Biblioteca</h3>
              <p id="home-atividades-description">Veja, crie e configure atividades.</p>
            </Link>
          </div>
        </nav>
      </main>
    </div>
  )
}
