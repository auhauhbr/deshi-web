import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api.js'
import { logoutUser } from '../../services/authService.js'
import ProfessionalNavigation from '../../components/ProfessionalNavigation.jsx'
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
  const navigate = useNavigate()
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

  async function handleLogout() {
    try { await logoutUser() } finally { navigate('/login', { replace: true, state: { message: 'Você saiu da sua conta com segurança.' } }) }
  }

  const today = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

  return <main className="professional-home">
    <ProfessionalNavigation />
    <div className="professional-home__container">
      <header className="professional-home__header">
        <div className="professional-home__intro">
          <p className="professional-home__eyebrow">PAINEL DO PROFISSIONAL <span aria-hidden="true">/</span> {today}</p>
          <h1>{getGreeting()}, {user.name?.trim().split(/\s+/)[0] || 'profissional'}.</h1>
          <p className="professional-home__date">Acompanhe a rotina dos seus alunos e veja o que está acontecendo hoje.</p>
        </div>
        <details className="profile-menu">
          <summary className="professional-home__avatar" aria-label={`Abrir opções de ${user.name || 'usuário'}`} title="Opções da conta">{initials(user.name)}<span className="profile-menu__chevron" aria-hidden="true">⌄</span></summary>
          <div className="profile-menu__panel">
            <span className="profile-menu__name">{user.name || 'Profissional'}</span>
            {user.email && <span className="profile-menu__email">{user.email}</span>}
            <button type="button" onClick={handleLogout}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3m9-7h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7" /></svg>Sair da conta</button>
          </div>
        </details>
      </header>

      {error && <p className="professional-home__error" role="alert">{error}</p>}

      <section className="professional-home__overview" aria-label="Resumo dos treinos de hoje">
        <div className="overview-heading"><div><p className="section-kicker">O DIA EM MOVIMENTO</p><h2>Resumo de hoje</h2></div><Link className="overview-link" to="/alunos">Ver alunos <span aria-hidden="true">↗</span></Link></div>
        <div className="professional-home__stats">
          <article className="stat-card stat-card--live">
            <div className="stat-card__top"><span className="stat-card__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 12h4l3-8 4 16 3-8h4" /></svg></span><span className="stat-card__tag"><i /> AO VIVO</span></div>
            <strong>{loading ? '—' : trainingCount}</strong><span className="stat-card__label">Treinando agora</span>
            <p>{loading ? 'Atualizando atividade da equipe…' : trainingCount ? 'Alunos em uma sessão neste momento.' : 'Nenhum treino em andamento neste momento.'}</p>
            <div className="stat-card__track"><i style={{ width: `${trackedCount ? (trainingCount / trackedCount) * 100 : 0}%` }} /></div>
          </article>
          <article className="stat-card stat-card--done">
            <div className="stat-card__top"><span className="stat-card__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg></span><span className="stat-card__tag">{loading ? 'HOJE' : `${completionRate}% DA EQUIPE`}</span></div>
            <strong>{loading ? '—' : completedCount}</strong><span className="stat-card__label">Treinos concluídos</span>
            <p>{loading ? 'Resumo das conclusões de hoje.' : `De ${trackedCount} aluno${trackedCount === 1 ? '' : 's'} acompanhados hoje.`}</p>
            <div className="stat-card__track"><i style={{ width: `${loading ? 0 : completionRate}%` }} /></div>
          </article>
          <article className="stat-card stat-card--pending">
            <div className="stat-card__top"><span className="stat-card__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></svg></span><span className="stat-card__tag">PENDENTES</span></div>
            <strong>{loading ? '—' : notStartedCount}</strong><span className="stat-card__label">Sem treino hoje</span>
            <p>{loading ? 'Aguardando dados da equipe.' : notStartedCount ? 'Alunos que ainda podem iniciar a rotina.' : 'Sua equipe está em dia com a rotina.'}</p>
            <div className="stat-card__track"><i style={{ width: `${trackedCount ? (notStartedCount / trackedCount) * 100 : 0}%` }} /></div>
          </article>
        </div>
      </section>

      <div className="professional-home__activity-grid">
        <section className="dashboard-section dashboard-section--training">
          <div className="dashboard-section__heading"><div><p className="section-kicker">ACOMPANHAMENTO AO VIVO</p><h2>Em treino agora</h2></div><span className="section-count">{loading ? '—' : `${dashboard?.training?.length ?? 0} ativos`}</span></div>
          <div className="student-list">
            {loading ? <p className="empty-state">Carregando sessões…</p> : dashboard?.training?.length ? dashboard.training.map((student) => <article className="student-row" key={student.sessionId}>
              <span className="student-avatar">{initials(student.name)}</span><div className="student-row__main"><strong>{student.name}</strong><span>{student.programName} · {student.activityName || `${student.completedActivities} de ${student.totalActivities} atividades`}</span></div><div className="student-row__status"><strong>{formatDuration(student.startedAt)}</strong><span><i />Ao vivo</span></div>
            </article>) : <div className="empty-state"><span className="empty-state__mark" aria-hidden="true">↗</span><strong>Sem sessões ativas</strong><span>Quando um aluno começar a treinar, o acompanhamento aparece aqui.</span></div>}
          </div>
        </section>

        <section className="dashboard-section dashboard-section--recent">
          <div className="dashboard-section__heading"><div><p className="section-kicker">ACONTECEU POR AQUI</p><h2>Atividade recente</h2></div></div>
          <div className="activity-list">
            {loading ? <p className="empty-state">Carregando atividades…</p> : dashboard?.recentActivities?.length ? dashboard.recentActivities.map((activity) => <article className="activity-row" key={activity.id}>
              <span className={`activity-icon activity-icon--${activity.type}`} aria-hidden="true">{activity.type === 'completed' ? '✓' : '↗'}</span><div className="activity-row__main"><strong>{activity.title}</strong><span>{activity.description}</span></div><time>{new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(activity.at))}</time>
            </article>) : <div className="empty-state"><span className="empty-state__mark" aria-hidden="true">◷</span><strong>Nenhuma movimentação ainda</strong><span>As atividades dos seus alunos aparecerão aqui.</span></div>}
          </div>
        </section>
      </div>
      <footer className="professional-home__footer"><span><strong>DESHI</strong><i aria-hidden="true">·</i> Gestão da rotina esportiva</span><span>Feito para quem ensina movimento.</span></footer>
    </div>
  </main>
}

export default ProfessionalHomePage
