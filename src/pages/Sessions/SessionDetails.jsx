import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/authService.js'
import StudentBottomNav from '../../components/StudentBottomNav.jsx'
import BrandLogo from '../../components/BrandLogo.jsx'
import {
  completeActivity,
  endActivityRest,
  finishSession,
  getStudentPrograms,
  getStudentSessions,
  interruptSession,
  pauseActivity,
  resumeActivity,
  startActivity,
  startActivityRest,
} from '../../services/sessionService.js'
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

function formatDuration(milliseconds = 0) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

function getDurationFromStart(value, now) {
  if (!value) return 0
  const startedAt = new Date(value).getTime()
  return Number.isNaN(startedAt) ? 0 : Math.max(0, now - startedAt)
}

function getActivityDurations(activity, now) {
  const tracking = activity.timeTracking || {}

  return {
    active: (tracking.activeTimeMs || 0) + (activity.status === 'IN_PROGRESS'
      ? getDurationFromStart(tracking.activeStartedAt, now)
      : 0),
    pause: (tracking.pauseTimeMs || 0) + (activity.status === 'PAUSED'
      ? getDurationFromStart(tracking.pauseStartedAt, now)
      : 0),
    rest: (tracking.restTimeMs || 0) + (activity.status === 'RESTING'
      ? getDurationFromStart(tracking.restStartedAt, now)
      : 0),
  }
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
  const [timeActionMessage, setTimeActionMessage] = useState('')
  const [pendingActivityId, setPendingActivityId] = useState('')
  const [confirmSessionAction, setConfirmSessionAction] = useState('')
  const [isUpdatingSession, setIsUpdatingSession] = useState(false)
  const [now, setNow] = useState(Date.now())

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

  useEffect(() => {
    const hasRunningClock = session?.activities?.some((activity) => (
      ['IN_PROGRESS', 'PAUSED', 'RESTING'].includes(activity.status)
    ))

    if (!hasRunningClock) return undefined

    const intervalId = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
  }, [session?.activities])

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
            <BrandLogo className="session-brand-logo" />
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
        <StudentBottomNav active="todo" />
      </main>
    )
  }

  const activities = [...(session.activities || [])].sort(
    (first, second) => first.order - second.order,
  )

  async function runTimeAction(activityId, action) {
    setPendingActivityId(activityId)
    setTimeActionMessage('')

    try {
      const updatedSession = await action(session.id, activityId)
      setSession((current) => ({
        ...updatedSession,
        professionalName: updatedSession.professionalName || current.professionalName,
      }))
    } catch (error) {
      setTimeActionMessage(getApiErrorMessage(error, 'Não foi possível atualizar o tempo da atividade.'))
    } finally {
      setPendingActivityId('')
    }
  }

  async function confirmSessionUpdate() {
    if (!confirmSessionAction) return

    setIsUpdatingSession(true)
    setTimeActionMessage('')

    try {
      const update = confirmSessionAction === 'finish' ? finishSession : interruptSession
      const updatedSession = await update(session.id)
      setSession((current) => ({
        ...updatedSession,
        professionalName: updatedSession.professionalName || current.professionalName,
      }))
      setConfirmSessionAction('')
    } catch (error) {
      setTimeActionMessage(getApiErrorMessage(error, 'Não foi possível atualizar o estado da sessão.'))
    } finally {
      setIsUpdatingSession(false)
    }
  }

  return (
    <main className="start-session-page">
      <header className="session-header">
        <div className="session-brand">
          <BrandLogo className="session-brand-logo" />
        </div>
        <span className="session-header-label">Sessão de treino</span>
      </header>

      <section className="session-details-content">
        <div className="session-heading">
          <p className="session-eyebrow">
            {session.status === 'COMPLETED'
              ? 'SESSÃO CONCLUÍDA'
              : session.status === 'INTERRUPTED' ? 'SESSÃO INTERROMPIDA' : 'SESSÃO INICIADA'}
          </p>
          <h1>
            {session.status === 'COMPLETED'
              ? 'Sessão finalizada.'
              : session.status === 'INTERRUPTED' ? 'Sessão interrompida.' : 'Seu programa está pronto.'}
          </h1>
          <p>
            {session.status === 'IN_PROGRESS'
              ? 'Acompanhe abaixo as atividades e os tempos registrados.'
              : 'Seus registros e atividades permanecem salvos nesta sessão.'}
          </p>
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
            {session.finishedAt && (
              <div>
                <dt>Encerrada em</dt>
                <dd>{formatStartedAt(session.finishedAt)}</dd>
              </div>
            )}
          </dl>

          {session.status === 'IN_PROGRESS' && (
            <div className="session-end-actions">
              <p>Finalize a sessão ou interrompa mantendo os registros feitos até agora.</p>
              <div>
                <button type="button" className="session-start-button" disabled={isUpdatingSession || Boolean(pendingActivityId)} onClick={() => setConfirmSessionAction('finish')}>
                  Finalizar sessão
                </button>
                <button type="button" className="session-secondary-button" disabled={isUpdatingSession || Boolean(pendingActivityId)} onClick={() => setConfirmSessionAction('interrupt')}>
                  Interromper sessão
                </button>
              </div>
            </div>
          )}

          {confirmSessionAction && (
            <div className="session-confirm-backdrop">
              <section className="session-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="session-confirm-title" aria-describedby="session-confirm-description">
                <h2 id="session-confirm-title">
                  {confirmSessionAction === 'finish' ? 'Finalizar sessão?' : 'Interromper sessão?'}
                </h2>
                <p id="session-confirm-description">
                  {confirmSessionAction === 'finish'
                    ? 'A sessão será concluída. Atividades ainda em andamento, pausadas ou em descanso serão mantidas como incompletas, com os tempos registrados.'
                    : 'A sessão será marcada como interrompida. Os registros e as atividades incompletas permanecerão salvos no histórico.'}
                </p>
                <div className="session-confirm-actions">
                  <button type="button" className="session-secondary-button" disabled={isUpdatingSession} onClick={() => setConfirmSessionAction('')}>
                    Voltar
                  </button>
                  <button type="button" className="session-start-button" disabled={isUpdatingSession} onClick={confirmSessionUpdate}>
                    {isUpdatingSession
                      ? 'Salvando...'
                      : confirmSessionAction === 'finish' ? 'Confirmar finalização' : 'Confirmar interrupção'}
                  </button>
                </div>
              </section>
            </div>
          )}

          <div className="session-activity-heading">
            <h2>Atividades</h2>
            <span>{activities.length}</span>
          </div>

          {timeActionMessage && <p className="session-message" role="alert">{timeActionMessage}</p>}

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
                    {activity.timeTracking && (() => {
                      const durations = getActivityDurations(activity, now)

                      return (
                        <dl className="activity-time-summary" aria-label="Tempos da atividade">
                          <div><dt>Ativo</dt><dd>{formatDuration(durations.active)}</dd></div>
                          <div><dt>Pausa</dt><dd>{formatDuration(durations.pause)}</dd></div>
                          <div><dt>Descanso</dt><dd>{formatDuration(durations.rest)}</dd></div>
                        </dl>
                      )
                    })()}
                  </div>
                  <span className={`session-activity-status status-${(activity.status || 'PENDING').toLowerCase()}`}>
                    {statusLabels[activity.status] || activity.status || 'Pendente'}
                  </span>
                  {session.status === 'IN_PROGRESS' && (
                    <div className="session-activity-actions">
                      {activity.status === 'PENDING' && (
                        <button type="button" className="session-start-button session-activity-action" disabled={Boolean(pendingActivityId)} onClick={() => runTimeAction(activity.activityId, startActivity)}>
                          {pendingActivityId === activity.activityId ? 'Iniciando...' : 'Iniciar atividade'}
                        </button>
                      )}
                      {activity.status === 'IN_PROGRESS' && (
                        <>
                          <button type="button" className="session-secondary-button session-activity-action" disabled={Boolean(pendingActivityId)} onClick={() => runTimeAction(activity.activityId, pauseActivity)}>
                            {pendingActivityId === activity.activityId ? 'Atualizando...' : 'Pausar'}
                          </button>
                          <button type="button" className="session-secondary-button session-activity-action" disabled={Boolean(pendingActivityId)} onClick={() => runTimeAction(activity.activityId, startActivityRest)}>Iniciar descanso</button>
                          <button type="button" className="session-start-button session-activity-action" disabled={Boolean(pendingActivityId)} onClick={() => runTimeAction(activity.activityId, completeActivity)}>Concluir atividade</button>
                        </>
                      )}
                      {activity.status === 'PAUSED' && (
                        <>
                          <button type="button" className="session-start-button session-activity-action" disabled={Boolean(pendingActivityId)} onClick={() => runTimeAction(activity.activityId, resumeActivity)}>Retomar atividade</button>
                          <button type="button" className="session-secondary-button session-activity-action" disabled={Boolean(pendingActivityId)} onClick={() => runTimeAction(activity.activityId, completeActivity)}>Concluir atividade</button>
                        </>
                      )}
                      {activity.status === 'RESTING' && (
                        <>
                          <button type="button" className="session-start-button session-activity-action" disabled={Boolean(pendingActivityId)} onClick={() => runTimeAction(activity.activityId, endActivityRest)}>Encerrar descanso</button>
                          <button type="button" className="session-secondary-button session-activity-action" disabled={Boolean(pendingActivityId)} onClick={() => runTimeAction(activity.activityId, completeActivity)}>Concluir atividade</button>
                        </>
                      )}
                      {!['IN_PROGRESS', 'PAUSED', 'RESTING'].includes(activity.status) && (
                        <button
                          type="button"
                          className="session-secondary-button session-activity-action"
                          disabled={Boolean(pendingActivityId)}
                          onClick={() => navigate(`/sessions/${session.id}/executions/${activity.activityId}`, {
                            state: { session, activity },
                          })}
                        >
                          Registrar execução
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="session-activity-empty">Esta sessão não possui atividades.</p>
          )}
        </section>
      </section>
      <StudentBottomNav active={session.status === 'COMPLETED' ? 'completed' : 'todo'} />
    </main>
  )
}

export default SessionDetails
