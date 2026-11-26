import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, CirclePause, Clock3, Radio } from 'lucide-react'
import { api } from '../../services/api.js'
import FadeContent from '../../components/FadeContent.jsx'
import SlideTextButton from '../../components/kokonutui/slide-text-button.jsx'
import './ProfessionalHome.css'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function formatDuration(startedAt) {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000))
  return `${minutes} min`
}

function ProfessionalHomePage() {
  const user = JSON.parse(localStorage.getItem('deshi.user') || '{}')
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const trainingCount = dashboard?.counts?.training ?? 0
  const completedCount = dashboard?.counts?.completed ?? 0
  const notStartedCount = dashboard?.counts?.notStarted ?? 0
  const trackedCount = trainingCount + completedCount + notStartedCount
  const completionRate = trackedCount ? Math.round((completedCount / trackedCount) * 100) : 0

  useEffect(() => {
    api.get('/professional/home')
      .then(({ data }) => setDashboard(data))
      .catch(() => setError('Não foi possível carregar o resumo agora. Tente novamente em instantes.'))
      .finally(() => setLoading(false))
  }, [])

  const today = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

  return <main className="professional-home">
    <div className="professional-home__container">
      <header className="professional-home__header">
        <div className="professional-home__intro">
          <p className="professional-home__date">{today}</p>
          <h1>{getGreeting()}, {user.name?.trim().split(/\s+/)[0] || 'profissional'}.</h1>
          <p className="professional-home__description">A rotina dos seus alunos, em um só lugar.</p>
        </div>
      </header>

      <FadeContent className="professional-home__content" trigger="mount" duration={0.48} delay={0.04} ease="power2.out">
        {error && <p className="professional-home__error" role="alert">{error}</p>}

        <section className="professional-home__overview" aria-label="Resumo dos treinos de hoje">
          <div className="overview-heading">
            <h2>Hoje na sua equipe</h2>
            <SlideTextButton className="overview-link" variant="ghost" text="Ver alunos" hoverText="Abrir alunos" to="/alunos" animateIn={false} />
          </div>
          <div className="professional-home__stats" aria-live={loading ? 'polite' : 'off'}>
            <article className="stat-item stat-item--live">
              <span className="stat-item__label"><i aria-hidden="true" /> Treinando agora</span>
              <strong>{loading ? '—' : trainingCount}</strong>
              <span className="stat-item__detail">{loading ? 'Atualizando atividade…' : trainingCount ? 'Alunos em sessão neste momento' : 'Nenhum treino em andamento'}</span>
            </article>
            <article className="stat-item">
              <span className="stat-item__label">Treinos concluídos</span>
              <strong>{loading ? '—' : completedCount}</strong>
              <span className="stat-item__detail">{loading ? 'Resumo de hoje' : `${completionRate}% dos ${trackedCount} alunos acompanhados`}</span>
            </article>
            <article className="stat-item">
              <span className="stat-item__label">Ainda não começaram</span>
              <strong>{loading ? '—' : notStartedCount}</strong>
              <span className="stat-item__detail">{loading ? 'Aguardando dados da equipe' : notStartedCount ? 'Alunos que ainda podem treinar hoje' : 'Rotina em dia'}</span>
            </article>
          </div>
        </section>

        <div className="professional-home__activity-grid">
          <section className="dashboard-section dashboard-section--recent">
            <div className="dashboard-section__heading"><h2>Atividade recente</h2></div>
            <div className="activity-list">
              {loading ? <p className="empty-state">Carregando atividades…</p> : dashboard?.recentActivities?.length ? dashboard.recentActivities.map((activity) => {
                const interrupted = activity.type === 'interrupted'
                const Icon = interrupted ? CirclePause : Check
                return <Link className="activity-row" key={activity.id} to={`/professional/sessions/${encodeURIComponent(activity.id)}`} state={{ from: '/home' }} aria-label={`Ver sessão de ${activity.studentName || 'aluno'}: ${activity.programName || activity.title}`}>
                  <span className={`activity-icon activity-icon--${activity.type}`} aria-hidden="true"><Icon size={17} strokeWidth={2} /></span>
                  <div className="activity-row__main">
                    <strong>{activity.studentName ? <>{activity.studentName}<span className="activity-row__separator"> · </span>{activity.programName}</> : activity.title}</strong>
                    <span>{activity.completedActivities != null ? `${interrupted ? 'Treino interrompido' : 'Treino concluído'} · ${activity.completedActivities} de ${activity.totalActivities} atividades concluídas` : activity.description}</span>
                  </div>
                  <time dateTime={activity.at}>
                    <span>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(activity.at))}</span>
                    <span>{new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(activity.at))}</span>
                  </time>
                  <span className="activity-row__open"><span>Ver sessão</span><ArrowRight size={16} aria-hidden="true" /></span>
                </Link>
              }) : <div className="empty-state"><Clock3 className="empty-state__icon" aria-hidden="true" size={22} /><strong>Nenhuma movimentação ainda</strong><span>Os treinos dos seus alunos aparecerão aqui.</span></div>}
            </div>
          </section>

          <section className="dashboard-section dashboard-section--training">
            <div className="dashboard-section__heading"><h2>Em treino agora</h2><span className="section-count">{loading ? '—' : `${dashboard?.training?.length ?? 0} ativos`}</span></div>
            <div className="student-list">
              {loading ? <p className="empty-state">Carregando sessões…</p> : dashboard?.training?.length ? dashboard.training.map((student) => <article className="student-row" key={student.sessionId}>
                <span className="student-avatar" aria-hidden="true">{initials(student.name)}</span>
                <div className="student-row__main"><strong>{student.name}</strong><span>{student.programName} · {student.activityName || `${student.completedActivities} de ${student.totalActivities} atividades`}</span></div>
                <div className="student-row__status"><strong>{formatDuration(student.startedAt)}</strong><span><Radio size={13} aria-hidden="true" />Ao vivo</span></div>
              </article>) : <div className="empty-state"><Radio className="empty-state__icon" aria-hidden="true" size={22} /><strong>Sem sessões ativas</strong><span>Quando um aluno começar a treinar, o acompanhamento aparece aqui.</span></div>}
            </div>
          </section>
        </div>
        <footer className="professional-home__footer"><span><strong>DESHI</strong><i aria-hidden="true">·</i> Gestão da rotina esportiva</span><span>Feito para quem ensina movimento.</span></footer>
      </FadeContent>
    </div>
  </main>
}

export default ProfessionalHomePage
