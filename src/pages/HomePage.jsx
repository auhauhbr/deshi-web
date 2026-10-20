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
              <span className="home-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="2" />
                  <rect x="14" y="3" width="7" height="7" rx="2" />
                  <rect x="3" y="14" width="7" height="7" rx="2" />
                  <path d="m14 18 2.5 2.5L21 15" />
                </svg>
              </span>
              <h3 id="home-modalidades-title">Minhas modalidades</h3>
              <p id="home-modalidades-description">Escolha e atualize as modalidades em que você atua.</p>
              <span className="home-card-action" aria-hidden="true">Gerenciar modalidades <span>→</span></span>
            </Link>

            <Link className="home-card" to="/atividades" aria-labelledby="home-atividades-title" aria-describedby="home-atividades-description">
              <span className="home-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3h5v18H3zM8 3h5v18H8zM15 4l4-1 3 17-4 1z" />
                  <path d="M3 7h10M3 17h10" />
                </svg>
              </span>
              <h3 id="home-atividades-title">Biblioteca de atividades</h3>
              <p id="home-atividades-description">Encontre atividades, crie as suas e configure suas informações.</p>
              <span className="home-card-action" aria-hidden="true">Explorar biblioteca <span>→</span></span>
            </Link>
          </div>
        </nav>
      </main>
    </div>
  )
}
