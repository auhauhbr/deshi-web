import { Link } from 'react-router-dom'
import './Landing.css'

const currentYear = new Date().getFullYear()

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4.167 10h11.666M10 4.167 15.833 10 10 15.833" />
    </svg>
  )
}

function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-container landing-header-content">
          <Link className="landing-brand" to="/" aria-label="Deshi, página inicial">
            <span className="landing-brand-mark" aria-hidden="true">D</span>
            <span>deshi</span>
          </Link>

          <nav className="landing-nav" aria-label="Navegação principal">
            <a href="#recursos">Recursos</a>
            <a href="#para-quem">Para quem</a>
            <a href="#como-funciona">Como funciona</a>
          </nav>

          <div className="landing-header-actions">
            <Link className="landing-login" to="/login">Entrar</Link>
            <Link className="landing-button landing-button-small" to="/cadastro">
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-container landing-hero-grid">
            <div className="landing-hero-copy">
              <p className="landing-eyebrow"><span /> Gestão esportiva sem complicação</p>
              <h1>Mais foco no treino. <span>Menos tempo na organização.</span></h1>
              <p className="landing-hero-description">
                O Deshi aproxima profissionais e alunos para organizar treinos,
                programas e resultados em um só lugar.
              </p>
              <div className="landing-hero-actions">
                <Link className="landing-button" to="/cadastro">
                  Comece agora <ArrowIcon />
                </Link>
                <a className="landing-text-link" href="#recursos">Conheça a plataforma</a>
              </div>
              <p className="landing-hero-note">Feito para profissionais e alunos.</p>
            </div>

            <div className="landing-preview-wrap" aria-label="Prévia ilustrativa da plataforma">
              <div className="landing-preview-glow" />
              <div className="landing-preview">
                <div className="preview-topbar">
                  <div className="preview-brand">
                    <span className="preview-brand-mark">D</span>
                    <span>deshi</span>
                  </div>
                  <span className="preview-profile"><span /> Área profissional</span>
                </div>
                <div className="preview-content">
                  <p className="preview-overline">SUA ROTINA, MAIS ORGANIZADA</p>
                  <h2>Treinos em um só lugar</h2>
                  <p className="preview-subtitle">Acompanhe programas e alunos com mais clareza.</p>
                  <div className="preview-summary">
                    <span className="preview-summary-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M7 3v3m10-3v3M4.5 9h15M6 5h12a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 18 20H6a1.5 1.5 0 0 1-1.5-1.5v-12A1.5 1.5 0 0 1 6 5Z" />
                        <path d="m9 14 2 2 4-4" />
                      </svg>
                    </span>
                    <span><strong>Rotina de treinos</strong><small>Programas organizados para acompanhar</small></span>
                    <span className="preview-summary-arrow" aria-hidden="true"><ArrowIcon /></span>
                  </div>
                  <div className="preview-section-heading">
                    <strong>Visão da semana</strong>
                    <span>Organização que acompanha você</span>
                  </div>
                  <div className="preview-week" aria-hidden="true">
                    <span><i />Seg</span>
                    <span><i />Ter</span>
                    <span className="preview-week-active"><i />Qua</span>
                    <span><i />Qui</span>
                    <span><i />Sex</span>
                    <span><i />Sáb</span>
                    <span><i />Dom</span>
                  </div>
                  <div className="preview-footer">
                    <span className="preview-avatar">D</span>
                    <span><strong>Uma rotina mais leve</strong><small>Para profissionais e alunos</small></span>
                    <span className="preview-footer-check" aria-hidden="true">✓</span>
                  </div>
                </div>
              </div>
              <div className="preview-caption"><span /> Prévia ilustrativa da plataforma</div>
            </div>
          </div>
        </section>

        <section className="landing-benefits" id="recursos">
          <div className="landing-container">
            <div className="landing-section-heading">
              <p className="landing-eyebrow">Tudo mais conectado</p>
              <h2>Uma rotina esportiva mais simples começa com organização.</h2>
              <p>Tenha o essencial para acompanhar treinos e evolução sem complicar o dia a dia.</p>
            </div>
            <div className="landing-feature-grid">
              <article className="landing-feature-card">
                <span className="feature-icon feature-icon-green" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20m6-9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-7.5a4 4 0 0 1 0 7.75M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35" /></svg>
                </span>
                <h3>Alunos e treinos organizados</h3>
                <p>Reúna as informações da sua rotina esportiva e encontre o que precisa com mais facilidade.</p>
              </article>
              <article className="landing-feature-card">
                <span className="feature-icon feature-icon-lime" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M5 4.75h14A1.25 1.25 0 0 1 20.25 6v14L17 18.25 13.75 20 10.5 18.25 7.25 20 3.75 18V6A1.25 1.25 0 0 1 5 4.75Z" /><path d="M8 9h8M8 13h5" /></svg>
                </span>
                <h3>Programas em um só lugar</h3>
                <p>Organize programas esportivos com uma visão clara para profissionais e alunos.</p>
              </article>
              <article className="landing-feature-card">
                <span className="feature-icon feature-icon-dark" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M4 19.25h16M6.75 16V11m5.25 5V5m5.25 11v-7" /><path d="m5.5 8.5 5.25-4 5.25 3 3.5-3" /></svg>
                </span>
                <h3>Resultados acompanhados</h3>
                <p>Tenha os resultados por perto para acompanhar a jornada e manter o foco na evolução.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="landing-audience" id="para-quem">
          <div className="landing-container landing-audience-grid">
            <div className="landing-audience-copy">
              <p className="landing-eyebrow">Uma plataforma, duas jornadas</p>
              <h2>Seu treino conectado a quem acompanha sua evolução.</h2>
              <p>O Deshi foi pensado para deixar a rotina mais clara, seja para orientar ou para treinar.</p>
              <a className="landing-text-link" href="#como-funciona">Veja como começar <ArrowIcon /></a>
            </div>
            <div className="landing-audience-cards">
              <article className="audience-card">
                <span className="audience-card-number">01</span>
                <div>
                  <p>Para profissionais</p>
                  <h3>Mais clareza para cuidar da sua equipe.</h3>
                  <span>Organize alunos e treinos em um só lugar.</span>
                </div>
                <span className="audience-card-arrow" aria-hidden="true"><ArrowIcon /></span>
              </article>
              <article className="audience-card audience-card-student">
                <span className="audience-card-number">02</span>
                <div>
                  <p>Para alunos</p>
                  <h3>Acompanhe sua rotina esportiva.</h3>
                  <span>Tenha seus programas e resultados por perto.</span>
                </div>
                <span className="audience-card-arrow" aria-hidden="true"><ArrowIcon /></span>
              </article>
            </div>
          </div>
        </section>

        <section className="landing-steps" id="como-funciona">
          <div className="landing-container">
            <div className="landing-section-heading">
              <p className="landing-eyebrow">Para começar</p>
              <h2>Um primeiro passo de cada vez.</h2>
            </div>
            <ol className="landing-step-list">
              <li><span>01</span><div><h3>Crie sua conta</h3><p>Leva poucos instantes para se cadastrar.</p></div></li>
              <li><span>02</span><div><h3>Escolha seu perfil</h3><p>Indique se você é profissional ou aluno.</p></div></li>
              <li><span>03</span><div><h3>Organize sua rotina</h3><p>Acesse a plataforma e acompanhe seus treinos.</p></div></li>
            </ol>
          </div>
        </section>

        <section className="landing-cta">
          <div className="landing-container landing-cta-content">
            <div>
              <p className="landing-eyebrow">Seu próximo passo começa aqui</p>
              <h2>Mais organização para a sua jornada esportiva.</h2>
              <p>Crie sua conta e tenha sua rotina esportiva em um só lugar.</p>
            </div>
            <Link className="landing-button landing-button-light" to="/cadastro">
              Criar minha conta <ArrowIcon />
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-content">
          <Link className="landing-brand" to="/" aria-label="Deshi, página inicial">
            <span className="landing-brand-mark" aria-hidden="true">D</span>
            <span>deshi</span>
          </Link>
          <p>Gestão esportiva sem complicação.</p>
          <span>© {currentYear} Deshi</span>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
