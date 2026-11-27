import { useEffect, useState } from 'react'
import { Activity, ArrowRight, ClipboardCheck, Dumbbell, MessageCircle, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import BrandLogo from '../../components/BrandLogo.jsx'
import AnimatedContent from '../../components/AnimatedContent.jsx'
import CodeSlots from '../../components/CodeSlots.jsx'
import DriftWall from '../../components/DriftWall.jsx'
import Grainient from '../../components/Grainient.jsx'
import VariableProximity from '../../components/VariableProximity.jsx'
import SlideTextButton from '../../components/kokonutui/slide-text-button.jsx'
import { MarkerText, Mark } from '../../components/kokonutui/marker-text.jsx'
import './Landing.css'

const currentYear = new Date().getFullYear()
const DEMO_INVITE_CODE = '3JXN38MX'
const GRAINIENT_COLORS = ['#111d20', '#0c493d', '#31d883']
const DRIFT_ITEMS = [
  { title: 'Força', category: 'Musculação', accent: '#00d9a0' },
  { title: 'Técnica', category: 'Artes marciais', accent: '#14856c' },
  { title: 'Ritmo', category: 'Condicionamento', accent: '#42e88b' },
  { title: 'Controle', category: 'Calistenia', accent: '#00bd8b' },
  { title: 'Potência', category: 'Treino funcional', accent: '#00d9a0' },
  { title: 'Evolução', category: 'Acompanhamento', accent: '#14856c' }
]

function LandingPage() {
  const [demoCode, setDemoCode] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setDemoCode(DEMO_INVITE_CODE), 700)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="landing-page">
      <div className="landing-grainient-backdrop" aria-hidden="true">
        <Grainient
          colors={GRAINIENT_COLORS}
          className="landing-grainient-canvas"
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
        />
      </div>

      <a className="landing-skip-link" href="#conteudo">Pular para o conteúdo</a>

      <header className="landing-header">
        <div className="landing-container landing-header-content">
          <Link className="landing-brand" to="/" aria-label="Deshi, página inicial">
            <BrandLogo className="landing-brand-logo" variant="dark" />
          </Link>

          <nav className="landing-nav" aria-label="Navegação principal">
            <a href="#profissionais">Profissionais</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#alunos">Alunos</a>
          </nav>

          <div className="landing-header-actions">
            <Link className="landing-login" to="/login">Entrar</Link>
            <Link className="landing-header-cta" to="/cadastro">Criar conta <ArrowRight aria-hidden="true" /></Link>
          </div>
        </div>
      </header>

      <main id="conteudo">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-container landing-hero-grid">
            <div className="landing-hero-copy" data-enter>
              <h1 id="landing-title">
                <VariableProximity
                  label="Seu método. Seus alunos. Cada treino no lugar."
                  fromFontVariationSettings="'wght' 560"
                  toFontVariationSettings="'wght' 615"
                  radius={180}
                  falloff="gaussian"
                  smoothing={0.16}
                  className="landing-variable-title"
                />
              </h1>
              <p className="landing-hero-description">
                Organize sua clientela, monte programas sob medida e acompanhe como cada sessão aconteceu — da primeira série ao retorno do aluno.
              </p>
              <div className="landing-hero-actions">
                <SlideTextButton
                  className="landing-kokonut-cta"
                  to="/cadastro"
                  text="Começar agora"
                  hoverText="Escolher meu perfil"
                />
                <Link className="landing-text-link" to="/login">Já tenho uma conta <ArrowRight aria-hidden="true" /></Link>
              </div>
              <p className="landing-audience-note">Para quem ensina musculação, luta, funcional, calistenia e outras modalidades.</p>
            </div>

            <div className="landing-hero-visual" aria-label="Modalidades acompanhadas pela DESHI">
              <DriftWall
                items={DRIFT_ITEMS}
                className="landing-drift-wall"
                columns={3}
                tileWidth={150}
                tileHeight={185}
                gap={12}
                radius={14}
                tilt={10}
                turn={-7}
                perspective={1100}
                depth={82}
                speed={24}
                direction="up"
                variance={0.28}
                parallax={0.26}
                lift={30}
                fade={0.2}
                dim={0.84}
                overlayColor="transparent"
              />
              <div className="landing-visual-index" aria-hidden="true">
                <Dumbbell />
                <span>Treino com<br />acompanhamento</span>
              </div>
              <p className="landing-visual-note" aria-hidden="true">Seu trabalho, no seu ritmo.</p>
            </div>
          </div>
        </section>

        <section className="landing-practice" id="profissionais" aria-labelledby="landing-practice-title">
          <div className="landing-container landing-practice-grid">
            <AnimatedContent className="landing-section-intro" distance={16} duration={0.7} initialOpacity={0.08}>
              <h2 id="landing-practice-title">Mais tempo para orientar. Menos tempo procurando informação.</h2>
              <p>Seu trabalho é individual. A organização também pode ser: cada aluno, programa e registro acessível quando você precisa.</p>
            </AnimatedContent>
            <AnimatedContent className="landing-benefit-grid" distance={18} duration={0.72} initialOpacity={0.06} stagger={0.12}>
              <article className="landing-benefit">
                <span className="landing-benefit-icon"><UsersRound aria-hidden="true" /></span>
                <h3>Cada aluno, uma história</h3>
                <MarkerText className="landing-benefit-marker">
                  <p>Consulte <Mark type="underline" color="#14856c">sessões recentes e retornos</Mark> no perfil de cada aluno.</p>
                </MarkerText>
              </article>
              <article className="landing-benefit">
                <span className="landing-benefit-icon"><Dumbbell aria-hidden="true" /></span>
                <h3>Treinos com o seu método</h3>
                <MarkerText className="landing-benefit-marker">
                  <p>Organize atividades e ajuste séries, repetições ou rounds <Mark type="highlight" color="#00d9a0">para cada modalidade.</Mark></p>
                </MarkerText>
              </article>
              <article className="landing-benefit">
                <span className="landing-benefit-icon"><MessageCircle aria-hidden="true" /></span>
                <h3>O retorno continua</h3>
                <MarkerText className="landing-benefit-marker">
                  <p>Veja como o aluno executou e use os comentários para <Mark type="underline" color="#14856c">orientar o próximo treino.</Mark></p>
                </MarkerText>
              </article>
            </AnimatedContent>
          </div>
        </section>

        <section className="landing-how" id="como-funciona" aria-labelledby="landing-how-title">
          <div className="landing-container landing-how-grid">
            <div className="landing-how-copy">
              <h2 id="landing-how-title">Da primeira conexão ao próximo ajuste.</h2>
              <p>O profissional organiza e orienta. O aluno executa, registra e devolve informações para o acompanhamento continuar.</p>
              <ol className="landing-how-steps">
                <li>
                  <span className="landing-step-index">01</span>
                  <div><h3>Crie o vínculo</h3><p>O profissional gera um convite; o aluno informa o código para conectar as contas.</p></div>
                </li>
                <li>
                  <span className="landing-step-index">02</span>
                  <div><h3>Envie o programa</h3><p>O profissional prepara o treino e o disponibiliza para aquele aluno.</p></div>
                </li>
                <li>
                  <span className="landing-step-index">03</span>
                  <div><h3>Acompanhe a execução</h3><p>O aluno registra séries, rounds e comentários; os dados ficam disponíveis para o profissional.</p></div>
                </li>
              </ol>
              <div className="landing-how-actions">
                <SlideTextButton
                  className="landing-kokonut-cta"
                  to="/cadastro"
                  text="Criar minha conta"
                  hoverText="Escolher meu perfil"
                />
                <Link id="alunos" className="landing-text-link" to="/login">Acessar como aluno <ArrowRight aria-hidden="true" /></Link>
              </div>
            </div>

            <aside className="landing-invite-demo" aria-label="Exemplo de código de convite preenchido automaticamente">
              <div className="landing-invite-topline">
                <span>Convite DESHI</span>
                <span className="landing-invite-state"><i /> Vínculo por código</span>
              </div>
              <div className="landing-invite-copy">
                <ClipboardCheck aria-hidden="true" />
                <div><h3>Uma conexão simples.</h3><p>O aluno usa o código enviado pelo profissional.</p></div>
              </div>
              <div className="landing-code-field">
                <span className="landing-code-label">Código de convite · exemplo</span>
                <CodeSlots
                  alphanumeric
                  length={8}
                  value={demoCode}
                  onChange={setDemoCode}
                  ariaLabel="Código de convite fictício preenchido automaticamente"
                  accentColor="#00d9a0"
                  inkColor="#103d32"
                  slotColor="#e7f5ee"
                  digitColor="#103d32"
                  slotSize={30}
                  gap={4}
                  radius={10}
                  cascade={90}
                  className="landing-code-slots"
                />
                <p className={`landing-code-status${demoCode.length === 8 ? ' is-ready' : ''}`} aria-live="polite">
                  <i /> {demoCode.length === 8 ? 'Exemplo preenchido automaticamente' : 'Preparando convite de demonstração'}
                </p>
              </div>
              <div className="landing-invite-return">
                <span><Activity aria-hidden="true" /> Treino executado</span>
                <ArrowRight aria-hidden="true" />
                <span><ClipboardCheck aria-hidden="true" /> Dados para acompanhar</span>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-content">
          <Link to="/" aria-label="Deshi, página inicial"><BrandLogo className="landing-footer-logo" variant="dark" /></Link>
          <span>Organização para quem vive o treino.</span>
          <div><Link to="/login">Entrar</Link><span>© {currentYear} DESHI</span></div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
