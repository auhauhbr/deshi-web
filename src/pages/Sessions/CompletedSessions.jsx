import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StudentBottomNav from '../../components/StudentBottomNav.jsx'
import StudentButton from '../../components/StudentButton.jsx'
import BrandLogo from '../../components/BrandLogo.jsx'
import { getApiErrorMessage } from '../../services/authService.js'
import { getStudentPrograms, getStudentSessions } from '../../services/sessionService.js'
import { useStudentEntrance } from '../../hooks/useStudentEntrance.js'
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
  const [loadAttempt, setLoadAttempt] = useState(0)
  const pageRef = useStudentEntrance([isLoading, sessions.length])

  useEffect(() => {
    let isCurrent = true

    async function loadSessions() {
      try {
        const [history, programs] = await Promise.all([getStudentSessions(), getStudentPrograms()])
        const programNames = new Map(programs.map((program) => [String(program.id), program.name]))
        const visibleSessions = history
          .filter((session) => ['COMPLETED', 'INTERRUPTED'].includes(session.status))
          .sort((first, second) => new Date(second.finishedAt || second.startedAt) - new Date(first.finishedAt || first.startedAt))
          .map((session) => ({ ...session, programName: programNames.get(String(session.programId)) || 'Programa de treino' }))

        if (isCurrent) setSessions(visibleSessions)
      } catch (error) {
        if (isCurrent) setMessage(getApiErrorMessage(error, 'Não foi possível carregar seu histórico de treinos.'))
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    loadSessions()

    return () => {
      isCurrent = false
    }
  }, [loadAttempt])

  return (
    <main ref={pageRef} className="start-session-page completed-sessions-page">
      <header className="session-header">
        <div className="session-brand">
          <BrandLogo className="session-brand-logo" variant="adaptive" to="/home" />
        </div>
      </header>

      <section className="session-details-content">
        <div className="session-heading">
          <p className="session-eyebrow">SEU HISTÓRICO</p>
          <h1>Histórico de treinos</h1>
        </div>

        {isLoading && <div className="session-details-card" role="status">Carregando seus treinos...</div>}
        {!isLoading && message && (
          <div className="session-message-history" role="alert">
            <p>{message}</p>
            <StudentButton variant="secondary" onClick={() => { setMessage(''); setIsLoading(true); setLoadAttempt((attempt) => attempt + 1) }}>
              Tentar novamente
            </StudentButton>
          </div>
        )}
        {!isLoading && !message && sessions.length === 0 && (
          <div className="session-details-card completed-sessions-empty">
            <span aria-hidden="true">✓</span>
            <h2>Nenhum treino no histórico</h2>
            <p>As sessões concluídas ou interrompidas aparecerão aqui.</p>
          </div>
        )}
        {!isLoading && !message && sessions.length > 0 && (
          <ol className="completed-sessions-list">
            {sessions.map((session) => (
              <li key={session.id} data-student-enter>
                <Link to={`/sessions/${session.id}`} className="completed-session-card">
                  <span className={`completed-session-icon${session.status === 'INTERRUPTED' ? ' is-interrupted' : ''}`} aria-hidden="true">{session.status === 'INTERRUPTED' ? '!' : '✓'}</span>
                  <span className="completed-session-info">
                    <strong>{session.status === 'INTERRUPTED' ? 'Treino interrompido' : 'Treino concluído'}</strong>
                    <small className="completed-session-program">{session.programName}</small>
                    <small>Início: {formatSessionDate(session.startedAt)}</small>
                    {session.finishedAt && <small>Término: {formatSessionDate(session.finishedAt)}</small>}
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
