import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StudentBottomNav from '../../components/StudentBottomNav.jsx'
import BrandLogo from '../../components/BrandLogo.jsx'
import { getApiErrorMessage } from '../../services/authService.js'
import { getStudentSessions } from '../../services/sessionService.js'
import './StartSession.css'
import './SessionDetails.css'
import './CompletedSessions.css'

function formatSessionDate(value) {
  if (!value) return 'Data não informada'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data não informada'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function CompletedSessions() {
  const [sessions, setSessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let isCurrent = true

    async function loadSessions() {
      try {
        const history = await getStudentSessions()
        const completed = history
          .filter((session) => session.status === 'COMPLETED')
          .sort((first, second) => new Date(second.finishedAt || second.startedAt) - new Date(first.finishedAt || first.startedAt))

        if (isCurrent) setSessions(completed)
      } catch (error) {
        if (isCurrent) setMessage(getApiErrorMessage(error, 'Não foi possível carregar seus treinos concluídos.'))
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    loadSessions()

    return () => {
      isCurrent = false
    }
  }, [])

  return (
    <main className="start-session-page completed-sessions-page">
      <header className="session-header">
        <div className="session-brand">
          <BrandLogo className="session-brand-logo" />
        </div>
        <span className="session-header-label">Área do aluno</span>
      </header>

      <section className="session-details-content">
        <div className="session-heading">
          <p className="session-eyebrow">SEU HISTÓRICO</p>
          <h1>Treinos concluídos</h1>
          <p>Consulte as sessões que você já finalizou.</p>
        </div>

        {isLoading && <div className="session-details-card" role="status">Carregando seus treinos...</div>}
        {!isLoading && message && <p className="session-message" role="alert">{message}</p>}
        {!isLoading && !message && sessions.length === 0 && (
          <div className="session-details-card completed-sessions-empty">
            <span aria-hidden="true">✓</span>
            <h2>Nenhum treino concluído</h2>
            <p>Quando você finalizar uma sessão, ela aparecerá aqui.</p>
          </div>
        )}
        {!isLoading && !message && sessions.length > 0 && (
          <ol className="completed-sessions-list">
            {sessions.map((session) => (
              <li key={session.id}>
                <Link to={`/sessions/${session.id}`} className="completed-session-card">
                  <span className="completed-session-icon" aria-hidden="true">✓</span>
                  <span className="completed-session-info">
                    <strong>Treino concluído</strong>
                    <small>{formatSessionDate(session.finishedAt || session.startedAt)}</small>
                    <small>{session.activities?.length || 0} {session.activities?.length === 1 ? 'atividade' : 'atividades'}</small>
                  </span>
                  <span className="completed-session-arrow" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      <StudentBottomNav active="completed" />
    </main>
  )
}

export default CompletedSessions
