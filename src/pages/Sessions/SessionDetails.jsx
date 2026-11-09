import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/authService.js'
import { getStudentPrograms, getStudentSessions } from '../../services/sessionService.js'
import './StartSession.css'
import './SessionDetails.css'

function formatStartedAt(value) {
  if (!value) return 'Horário não informado pela API'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Horário não informado pela API'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date)
}

function SessionDetails() {
  const { sessionId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const [session, setSession] = useState(
    state?.session?.id === sessionId ? state.session : null,
  )
  const [isLoading, setIsLoading] = useState(!session)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (session) return

    let isCurrent = true

    async function loadSession() {
      try {
        const [sessions, programs] = await Promise.all([
          getStudentSessions(),
          getStudentPrograms(),
        ])
        const foundSession = sessions.find((item) => item.id === sessionId)
        const matchingProgram = programs.find(
          (program) => program.id === foundSession?.programId,
        )

        if (isCurrent) {
          if (foundSession) {
            setSession({
              ...foundSession,
              professionalName:
                foundSession.professionalName || matchingProgram?.professionalName,
            })
          }
          else setMessage('A sessão não foi encontrada no seu histórico.')
        }
      } catch (error) {
        if (isCurrent) {
          setMessage(getApiErrorMessage(error, 'Não foi possível carregar a sessão.'))
        }
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    loadSession()

    return () => {
      isCurrent = false
    }
  }, [session, sessionId])

  const statusLabels = {
    IN_PROGRESS: 'Em andamento',
    COMPLETED: 'Concluída',
    INTERRUPTED: 'Interrompida',
    PENDING: 'Pendente',
    PAUSED: 'Pausada',
    RESTING: 'Em descanso',
    INCOMPLETE: 'Incompleta',
  }

  const showSessionUnavailable = !isLoading && !session

  if (isLoading || showSessionUnavailable) {
    return (
      <main className="start-session-page">
        <header className="session-header">
          <div className="session-brand">
            <span className="session-brand-mark">D</span>
            <span>deshi</span>
          </div>
          <span className="session-header-label">Área do aluno</span>
        </header>
        <section className="session-details-content">
          <div className="session-details-card" role="status" aria-live="polite">
            {isLoading ? (
              <p>Carregando sessão...</p>
            ) : (
              <>
                <h1>Não foi possível carregar esta sessão</h1>
                <p>{message}</p>
                <button type="button" className="session-secondary-button" onClick={() => navigate('/sessions/start')}>
                  Iniciar outra sessão
                </button>
              </>
            )}
          </div>
        </section>
      </main>
    )
  }

  const activities = [...(session.activities || [])].sort(
    (first, second) => first.order - second.order,
  )

  return (
    <main className="start-session-page">
      <header className="session-header">
        <div className="session-brand">
          <span className="session-brand-mark">D</span>
          <span>deshi</span>
        </div>
        <span className="session-header-label">Sessão de treino</span>
      </header>

      <section className="session-details-content">
        <div className="session-heading">
          <p className="session-eyebrow">SESSÃO INICIADA</p>
          <h1>Seu programa está pronto.</h1>
          <p>Acompanhe abaixo as atividades na ordem prevista.</p>
        </div>

        <section className="session-details-card" aria-label="Dados da sessão">
          <dl className="session-metadata">
            <div>
              <dt>Estado</dt>
              <dd>{statusLabels[session.status] || session.status || 'Não informado'}</dd>
            </div>
            <div>
              <dt>Iniciada em</dt>
              <dd>{formatStartedAt(session.startedAt)}</dd>
            </div>
            <div>
              <dt>Profissional responsável</dt>
              <dd>{session.professionalName || 'Nome não informado pela API'}</dd>
            </div>
          </dl>

          <div className="session-activity-heading">
            <h2>Atividades</h2>
            <span>{activities.length}</span>
          </div>

          {activities.length ? (
            <ol className="session-activity-list">
              {activities.map((activity, index) => (
                <li key={activity.activityId}>
                  <span className="session-activity-order">{index + 1}</span>
                  <div>
                    <strong>Atividade {index + 1}</strong>
                    <small>ID: {activity.activityId}</small>
                    {activity.execution?.values && (
                      <div className="session-execution-summary">
                        <small className="session-execution-heading">Dados executados nesta sessão</small>
                        <ul className="session-execution-values">
                          {Object.entries(activity.execution.values).map(([name, value]) => (
                            <li key={name}>{name}: {value}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <span className="session-activity-status">
                    {statusLabels[activity.status] || activity.status || 'Pendente'}
                  </span>
                  {activity.status !== 'COMPLETED' && activity.status !== 'INCOMPLETE' && (
                    <button
                      type="button"
                      className="session-secondary-button session-activity-action"
                      onClick={() => navigate(`/sessions/${session.id}/executions/${activity.activityId}`, {
                        state: { session, activity },
                      })}
                    >
                      Registrar execução
                    </button>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="session-activity-empty">Esta sessão não possui atividades.</p>
          )}
        </section>
      </section>
    </main>
  )
}

export default SessionDetails
