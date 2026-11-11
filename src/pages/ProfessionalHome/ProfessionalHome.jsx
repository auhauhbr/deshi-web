import { useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { logoutUser } from '../../services/authService.js'
import ProfessionalNavigation from '../../components/ProfessionalNavigation.jsx'
import { useNavigate } from 'react-router-dom'
import './ProfessionalHome.css'

const icons = { running: '↗', check: '✓', clock: '◷' }

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
  const [error, setError] = useState('')
  const trainingCount = dashboard?.counts?.training ?? 0
  const completedCount = dashboard?.counts?.completed ?? 0
  const notStartedCount = dashboard?.counts?.notStarted ?? 0
  const trackedCount = trainingCount + completedCount + notStartedCount
  const completionRate = trackedCount ? Math.round((completedCount / trackedCount) * 100) : 0

  useEffect(() => {
    api.get('/professional/home').then(({ data }) => setDashboard(data)).catch(() => {
      setError('Não foi possível carregar os dados agora.')
    })
  }, [])

  async function handleLogout() {
    try { await logoutUser() } finally { navigate('/login', { replace: true, state: { message: 'Você saiu da sua conta com segurança.' } }) }
  }

  return <main className="professional-home">
    <ProfessionalNavigation />
    <div className="professional-home__container">
      <header className="professional-home__header">
        <div><p className="professional-home__eyebrow">PAINEL DO PROFISSIONAL</p><h1>{getGreeting()}, {user.name?.trim().split(/\s+/)[0] || 'profissional'}</h1><p className="professional-home__date">Aqui está o resumo da sua equipe hoje.</p></div>
        <div className="professional-home__actions"><button className="notification-button" aria-label="Notificações" title="Notificações (em breve)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg><i /></button><details className="profile-menu"><summary className="professional-home__avatar" aria-label={`Abrir opções de ${user.name || 'usuário'}`} title="Opções da conta">{initials(user.name)}<span className="profile-menu__chevron" aria-hidden="true">⌄</span></summary><div className="profile-menu__panel"><span className="profile-menu__name">{user.name || 'Profissional'}</span>{user.email && <span className="profile-menu__email">{user.email}</span>}<button type="button" onClick={handleLogout}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3m9-7h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7" /></svg>Sair da conta</button></div></details></div>
      </header>

      {error && <p className="professional-home__error" role="alert">{error}</p>}
      <section className="professional-home__stats" aria-label="Resumo dos treinos de hoje">
        <article className="stat-card stat-card--live"><div className="stat-card__top"><span className="stat-card__icon">{icons.running}</span><span className="stat-card__tag">AO VIVO</span></div><strong>{dashboard?.counts?.training ?? '—'}</strong><span className="stat-card__label">Treinando agora</span><p>{dashboard?.counts?.training ? 'Acompanhe o andamento dos treinos ativos.' : 'Nenhum treino em andamento neste momento.'}</p><div className="stat-card__track"><i style={{ width: `${trackedCount ? (trainingCount / trackedCount) * 100 : 0}%` }} /></div></article>
        <article className="stat-card stat-card--done"><div className="stat-card__top"><span className="stat-card__icon">{icons.check}</span><span className="stat-card__tag">{dashboard ? `${completionRate}% DA EQUIPE` : 'HOJE'}</span></div><strong>{dashboard?.counts?.completed ?? '—'}</strong><span className="stat-card__label">Treinos concluídos</span><p>{dashboard ? `De ${trackedCount} aluno${trackedCount === 1 ? '' : 's'} acompanhados hoje.` : 'Resumo das conclusões de hoje.'}</p><div className="stat-card__track"><i style={{ width: `${completionRate}%` }} /></div></article>
        <article className="stat-card stat-card--pending"><div className="stat-card__top"><span className="stat-card__icon">{icons.clock}</span><span className="stat-card__tag">PENDENTES</span></div><strong>{dashboard?.counts?.notStarted ?? '—'}</strong><span className="stat-card__label">Sem treino hoje</span><p>{dashboard?.counts?.notStarted ? 'Alunos que ainda podem iniciar a rotina.' : 'Sua equipe está em dia com a rotina.'}</p><div className="stat-card__track"><i style={{ width: `${trackedCount ? (notStartedCount / trackedCount) * 100 : 0}%` }} /></div></article>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section__heading"><div><p className="section-kicker">ACOMPANHAMENTO AO VIVO</p><h2>Em treino agora</h2></div><span className="section-count">{dashboard?.training?.length ?? 0} ativos</span></div>
        <div className="student-list">
          {dashboard?.training?.length ? dashboard.training.map((student) => <article className="student-row" key={student.sessionId}>
            <span className="student-avatar">{initials(student.name)}</span><div className="student-row__main"><strong>{student.name}</strong><span>{student.programName} · {student.activityName || `${student.completedActivities} de ${student.totalActivities} atividades`}</span></div><div className="student-row__status"><strong>{formatDuration(student.startedAt)}</strong><span><i />Ao vivo</span></div>
          </article>) : <p className="empty-state">Nenhum aluno treinando neste momento.</p>}
        </div>
      </section>

      <section className="dashboard-section dashboard-section--recent">
        <div className="dashboard-section__heading"><div><p className="section-kicker">MOVIMENTAÇÕES</p><h2>Atividade recente</h2></div></div>
        <div className="activity-list">
          {dashboard?.recentActivities?.length ? dashboard.recentActivities.map((activity) => <article className="activity-row" key={activity.id}>
            <span className={`activity-icon activity-icon--${activity.type}`}>{activity.type === 'completed' ? '✓' : '↗'}</span><div className="activity-row__main"><strong>{activity.title}</strong><span>{activity.description}</span></div><time>{new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(activity.at))}</time>
          </article>) : <p className="empty-state">As atividades dos seus alunos aparecerão aqui.</p>}
        </div>
      </section>
      <footer className="professional-home__footer"><span>DESHI · Seu acompanhamento, em um só lugar</span></footer>
    </div>
  </main>
}

export default ProfessionalHomePage
