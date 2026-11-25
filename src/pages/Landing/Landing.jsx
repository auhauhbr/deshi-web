import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import BrandLogo from '../../components/BrandLogo.jsx'
import SlideTextButton from '../../components/kokonutui/slide-text-button.jsx'
import './Landing.css'

const currentYear = new Date().getFullYear()

function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-container landing-header-content">
          <Link className="landing-brand" to="/" aria-label="Deshi, página inicial">
            <BrandLogo className="landing-brand-logo" />
          </Link>

          <nav className="landing-nav" aria-label="Navegação principal">
            <a href="#profissionais">Para profissionais</a>
            <a href="#alunos">Para alunos</a>
            <a href="#como-funciona">Como funciona</a>
          </nav>

          <div className="landing-header-actions">
            <Link className="landing-login" to="/login">Entrar</Link>
            <Link className="landing-header-cta" to="/cadastro">Criar conta</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-container landing-hero-grid">
            <div className="landing-hero-copy">
              <h1>Ensine. Acompanhe.<br /><span>Deixe a rotina em ordem.</span></h1>
              <p className="landing-hero-description">
                O Deshi ajuda profissionais independentes a organizar alunos,
                montar programas de treino e acompanhar cada execução.
              </p>
              <div className="landing-hero-actions">
                <SlideTextButton
                  className="landing-kokonut-cta"
                  to="/cadastro"
                  text="Criar minha conta"
                  hoverText="Começar pelo cadastro"
                />
                <a className="landing-text-link" href="#como-funciona">Ver como funciona <ArrowRight aria-hidden="true" /></a>
              </div>
              <p className="landing-audience-note">
                Para personal trainers, professores de luta, funcional e outras modalidades.
              </p>
            </div>

            <aside className="landing-workbench" aria-label="O que o profissional acompanha no Deshi">
              <h2>O trabalho, acompanhado de perto.</h2>
              <p className="landing-workbench-intro">Da orientação do treino ao registro do aluno.</p>
              <ul className="landing-workbench-list">
                <li>
                  <span className="landing-workbench-index">A</span>
                  <span><strong>Alunos</strong><small>Vínculos e informações por pessoa</small></span>
                  <ArrowRight aria-hidden="true" />
                </li>
                <li>
                  <span className="landing-workbench-index">B</span>
                  <span><strong>Programas</strong><small>Treinos montados para cada aluno</small></span>
                  <ArrowRight aria-hidden="true" />
                </li>
                <li>
                  <span className="landing-workbench-index">C</span>
                  <span><strong>Execuções</strong><small>Registros para acompanhar a evolução</small></span>
                  <ArrowRight aria-hidden="true" />
                </li>
              </ul>
              <p className="landing-workbench-footnote">Uma ferramenta individual para quem dá aula por conta própria.</p>
            </aside>
          </div>
        </section>

        <section className="landing-practice" id="profissionais">
          <div className="landing-container landing-practice-grid">
            <div className="landing-section-intro">
              <h2>Seu trabalho não termina quando a aula acaba.</h2>
              <p>O acompanhamento continua entre um treino e outro. O Deshi reúne o que você precisa para conduzir essa rotina.</p>
            </div>
            <div className="landing-practice-list">
              <article>
                <div><h3>Tenha seus alunos por perto.</h3><p>Consulte vínculos, informações e histórico sem procurar em várias conversas.</p></div>
              </article>
              <article>
                <div><h3>Monte programas do seu jeito.</h3><p>Escolha atividades, configure cada uma e envie o programa para o aluno.</p></div>
              </article>
              <article>
                <div><h3>Veja como o treino aconteceu.</h3><p>Consulte execuções, registros e evolução para orientar os próximos passos.</p></div>
              </article>
            </div>
          </div>
        </section>

        <section className="landing-shared" aria-labelledby="landing-shared-title">
          <div className="landing-container">
            <div className="landing-shared-heading">
              <h2 id="landing-shared-title">Uma rotina mais clara para os dois lados.</h2>
              <p>O profissional organiza e orienta. O aluno encontra o que precisa para treinar e registrar como foi.</p>
            </div>
            <div className="landing-shared-rows">
              <article id="profissional">
                <h3><span>Profissional</span> Mais contexto para cada decisão.</h3>
                <p>Alunos, atividades, programas e execuções no mesmo espaço de trabalho.</p>
                <Link to="/cadastro">Criar conta profissional <ArrowRight aria-hidden="true" /></Link>
              </article>
              <article id="alunos">
                <h3><span>Aluno</span> Seu programa sempre à mão.</h3>
                <p>Consulte os treinos recebidos e registre cada sessão feita.</p>
                <Link to="/cadastro">Criar conta de aluno <ArrowRight aria-hidden="true" /></Link>
              </article>
            </div>
          </div>
        </section>

        <section className="landing-how" id="como-funciona">
          <div className="landing-container landing-how-grid">
            <h2>Comece com o que você já faz.</h2>
            <ol>
              <li><span>01</span><div><h3>Crie seu acesso</h3><p>Escolha se vai usar o Deshi como profissional ou aluno.</p></div></li>
              <li><span>02</span><div><h3>Monte sua rotina</h3><p>O profissional organiza os alunos e prepara os programas.</p></div></li>
              <li><span>03</span><div><h3>Acompanhe o treino</h3><p>O aluno executa; o profissional consulta os registros.</p></div></li>
            </ol>
          </div>
        </section>

        <section className="landing-close">
          <div className="landing-container landing-close-content">
            <h2>Cuide do treino.<br />O Deshi cuida da organização.</h2>
            <SlideTextButton
              className="landing-kokonut-cta landing-kokonut-cta-light"
              to="/cadastro"
              text="Criar minha conta"
              hoverText="Escolher meu perfil"
            />
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-content">
          <Link to="/" aria-label="Deshi, página inicial"><BrandLogo className="landing-footer-logo" variant="dark" /></Link>
          <span>Treino e acompanhamento, no mesmo ritmo.</span>
          <span>© {currentYear} Deshi</span>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
