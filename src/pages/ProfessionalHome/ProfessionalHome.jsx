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
        <div><p className="professional-home__eyebrow">PAINEL DO PROFISSIONAL</p><h1>{getGreeting()}, {user.name?.trim().split(/\s+/)[0] || 'profissional'}</h1></div>
        <div className="professional-home__actions"><button className="notification-button" aria-label="Notificações" title="Notificações (em breve)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg><i /></button><span className="professional-home__avatar" aria-label={user.name}>{initials(user.name)}</span></div>
      </header>

      {error && <p className="professional-home__error" role="alert">{error}</p>}
      <section className="professional-home__stats" aria-label="Resumo dos treinos de hoje">
        <article className="stat-card stat-card--live"><span className="stat-card__icon">{icons.running}</span><strong>{dashboard?.counts?.training ?? '—'}</strong><span>Treinando agora</span></article>
        <article className="stat-card stat-card--done"><span className="stat-card__icon">{icons.check}</span><strong>{dashboard?.counts?.completed ?? '—'}</strong><span>Concluíram hoje</span></article>
        <article className="stat-card stat-card--pending"><span className="stat-card__icon">{icons.clock}</span><strong>{dashboard?.counts?.notStarted ?? '—'}</strong><span>Ainda não treinaram</span></article>
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
      <footer className="professional-home__footer"><span>DESHI · Seu acompanhamento, em um só lugar</span><button onClick={handleLogout}>Sair da conta</button></footer>
    </div>
  </main>
}

export default ProfessionalHomePage
