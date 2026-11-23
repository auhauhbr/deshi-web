import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/authService.js'
import StudentBottomNav from '../../components/StudentBottomNav.jsx'
import StudentButton from '../../components/StudentButton.jsx'
import BrandLogo from '../../components/BrandLogo.jsx'
import ExerciseMedia from '../../components/ExerciseMedia.jsx'
import { METRICAS_ATIVIDADE } from '../../utils/metricas-atividade.js'
import SessionActionSlider from './SessionActionSlider.jsx'
import {
  finishSession,
  getStudentPrograms,
  getStudentSessions,
  interruptSession,
  pauseSession,
  resumeSession,
} from '../../services/sessionService.js'
import './StartSession.css'
import './SessionDetails.css'

function formatSessionClock(milliseconds = 0) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const clock = [minutes, seconds].map((value) => String(value).padStart(2, '0'))
  return hours ? [String(hours).padStart(2, '0'), ...clock].join(':') : clock.join(':')
}

function formatSessionDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function getDurationFromStart(value, now) {
  if (!value) return 0
  const startedAt = new Date(value).getTime()
  return Number.isNaN(startedAt) ? 0 : Math.max(0, now - startedAt)
}

function getActivityTimeSummary(activity, session, now) {
  const tracking = activity.timeTracking || {}
  const active = (tracking.activeTimeMs || 0)
    + (activity.status === 'IN_PROGRESS' && session.status === 'IN_PROGRESS' ? getDurationFromStart(tracking.activeStartedAt, now) : 0)
  const pause = (tracking.pauseTimeMs || 0)
    + (activity.status === 'PAUSED' && session.status === 'IN_PROGRESS' ? getDurationFromStart(tracking.pauseStartedAt, now) : 0)
  const rest = (tracking.restTimeMs || 0)
    + (activity.status === 'RESTING' && session.status === 'IN_PROGRESS' ? getDurationFromStart(tracking.restStartedAt, now) : 0)
  return active || pause || rest || tracking.activeStartedAt || tracking.pauseStartedAt || tracking.restStartedAt
    ? `Ativo ${formatSessionClock(active)} · pausa ${formatSessionClock(pause)} · descanso ${formatSessionClock(rest)}`
    : ''
}

function SessionDetails() {
  const { sessionId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const [session, setSession] = useState(
    state?.session?.id === sessionId ? state.session : null,
  )
  const [programName, setProgramName] = useState(state?.programName || '')
  const [isLoading, setIsLoading] = useState(!session)
  const [message, setMessage] = useState('')
  const [timeActionMessage, setTimeActionMessage] = useState('')
  const [isUpdatingSession, setIsUpdatingSession] = useState(false)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    let isCurrent = true

    async function loadSession() {
      try {
        const [sessions, programs] = await Promise.all([
          session ? Promise.resolve([]) : getStudentSessions(),
          getStudentPrograms(),
        ])
        const foundSession = session || sessions.find((item) => item.id === sessionId)
        const matchingProgram = programs.find(
          (program) => program.id === foundSession?.programId,
        )

        if (isCurrent) {
          if (matchingProgram?.name) setProgramName(matchingProgram.name)
          if (foundSession) {
            setSession((current) => ({
              ...foundSession,
              activities: (foundSession.activities || []).map((activity) => ({
                ...activity,
                nome: activity.nome || matchingProgram?.activities?.find(
                  (programActivity) => String(programActivity.activityId) === String(activity.activityId),
                )?.nome,
              })),
              professionalName: foundSession.professionalName || matchingProgram?.professionalName || current?.professionalName,
            }))
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
  }, [sessionId])

  useEffect(() => {
    if (session?.status !== 'IN_PROGRESS') return undefined

    const intervalId = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
  }, [session?.activities, session?.status])

  const showSessionUnavailable = !isLoading && !session

  if (isLoading || showSessionUnavailable) {
    return (
      <main className="start-session-page">
        <header className="session-header">
          <div className="session-brand">
            <BrandLogo className="session-brand-logo" to="/home" />
          </div>
        </header>
        <section className="session-details-content">
          <div className="session-details-card" role="status" aria-live="polite">
            {isLoading ? (
              <p>Carregando sessão...</p>
            ) : (
              <>
                <h1>Não foi possível carregar esta sessão</h1>
                <p>{message}</p>
                <StudentButton variant="secondary" className="session-secondary-button" onClick={() => navigate('/sessions/start')}>
                  Iniciar outra sessão
                </StudentButton>
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
  const completedActivities = activities.filter((activity) => activity.status === 'COMPLETED').length
  const activityCount = activities.length
  const progressPercent = activityCount ? Math.round((completedActivities / activityCount) * 100) : 0
  const sessionEnd = session.finishedAt ? new Date(session.finishedAt).getTime() : now
  const activeSessionPauseMs = session.pauseStartedAt
    ? getDurationFromStart(session.pauseStartedAt, now)
    : 0
  const elapsedSessionMs = Math.max(
    0,
    getDurationFromStart(session.startedAt, sessionEnd)
      - (session.pausedDurationMs || 0)
      - activeSessionPauseMs,
  )

  async function executeSessionAction(resolvedAction) {
    setIsUpdatingSession(true)
    setTimeActionMessage('')

    try {
      const update = {
        pause: pauseSession,
        resume: resumeSession,
        finish: finishSession,
        interrupt: interruptSession,
      }[resolvedAction]
      const updatedSession = await update(session.id)
      setSession((current) => ({
        ...updatedSession,
        professionalName: updatedSession.professionalName || current.professionalName,
        activities: updatedSession.activities.map((updatedActivity) => {
          const currentActivity = current.activities.find((item) => item.activityId === updatedActivity.activityId)
          return {
            ...updatedActivity,
            nome: updatedActivity.nome || currentActivity?.nome,
            descricao: updatedActivity.descricao || currentActivity?.descricao,
            midiaUrl: updatedActivity.midiaUrl || currentActivity?.midiaUrl,
            prescribed: updatedActivity.prescribed || currentActivity?.prescribed,
            executionValues: updatedActivity.executionValues || currentActivity?.executionValues,
          }
        }),
      }))
      setShowFinishConfirm(false)
      return true
    } catch (error) {
      setTimeActionMessage(getApiErrorMessage(error, 'Não foi possível atualizar o estado da sessão.'))
      return false
    } finally {
      setIsUpdatingSession(false)
    }
  }

  async function handleSessionAction(action) {
    const resolvedAction = action === 'toggle'
      ? session.status === 'PAUSED' ? 'resume' : 'pause'
      : action

    if (resolvedAction === 'finish' && completedActivities < activityCount) {
      setTimeActionMessage('')
      setShowFinishConfirm(true)
      return false
    }

    if (resolvedAction === 'interrupt' && !window.confirm('Interromper agora? Os registros feitos até aqui serão mantidos.')) return false

    return executeSessionAction(resolvedAction)
  }

  return (
    <main className="start-session-page">
      <header className="session-header">
        <div className="session-brand">
          <BrandLogo className="session-brand-logo" to="/home" />
        </div>
      </header>

      <section className="session-details-content">
        <section className="workout-session-summary" aria-label="Resumo do treino">
          <div className="workout-summary-heading">
            <div>
              <p className="session-eyebrow">{session.status === 'IN_PROGRESS' ? 'TREINO EM ANDAMENTO' : session.status === 'PAUSED' ? 'TREINO PAUSADO' : session.status === 'COMPLETED' ? 'TREINO CONCLUÍDO' : 'TREINO INTERROMPIDO'}</p>
              <h1>{programName || 'Seu treino'}</h1>
            </div>
            {session.professionalName && <span className="workout-coach-name">com {session.professionalName}</span>}
          </div>

          <p className="workout-session-times">
            Início: {formatSessionDateTime(session.startedAt) || 'não informado'}
            {session.finishedAt && <> · término: {formatSessionDateTime(session.finishedAt)}</>}
          </p>

          <div className="workout-live-clock" aria-live="off">
            <strong>{formatSessionClock(elapsedSessionMs)}</strong>
            <span>Tempo decorrido</span>
          </div>

          <div className="workout-progress-copy">
            <strong>{progressPercent}% concluído</strong>
            <span>{completedActivities} de {activityCount} {activityCount === 1 ? 'atividade' : 'atividades'}</span>
          </div>
          <div className="workout-progress-track" role="progressbar" aria-label="Progresso do treino" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progressPercent}>
            <span style={{ width: `${progressPercent}%` }} />
          </div>

          {['IN_PROGRESS', 'PAUSED'].includes(session.status) && (
            <SessionActionSlider
              status={session.status}
              busy={isUpdatingSession}
              onAction={handleSessionAction}
            />
          )}

          {timeActionMessage && !showFinishConfirm && <p className="session-message" role="alert">{timeActionMessage}</p>}

          {showFinishConfirm && (
            createPortal(<div className="session-confirm-backdrop">
              <section className="session-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="finish-confirm-title" aria-describedby="finish-confirm-description">
                <h2 id="finish-confirm-title">Ainda há atividades pendentes</h2>
                <p id="finish-confirm-description">
                  Você concluiu {completedActivities} de {activityCount} atividades. Se finalizar agora, as atividades restantes serão marcadas como incompletas. Deseja continuar?
                </p>
                {timeActionMessage && <p className="session-message" role="alert">{timeActionMessage}</p>}
                <div className="session-confirm-actions">
                  <StudentButton variant="secondary" className="session-secondary-button" disabled={isUpdatingSession} onClick={() => { setShowFinishConfirm(false); setTimeActionMessage('') }}>
                    Voltar ao treino
                  </StudentButton>
                  <StudentButton variant="primary" className="session-start-button" busy={isUpdatingSession} onClick={() => executeSessionAction('finish')}>
                    {isUpdatingSession ? 'Finalizando...' : 'Finalizar mesmo assim'}
                  </StudentButton>
                </div>
              </section>
            </div>, document.body)
          )}

          {['COMPLETED', 'INTERRUPTED'].includes(session.status) && (
            <p className="workout-terminal-note">{session.status === 'COMPLETED' ? 'Os registros deste treino foram salvos.' : 'Os registros feitos até a interrupção foram salvos.'}</p>
          )}
        </section>

        <section className="session-details-card" aria-label="Dados da sessão">
          <div className="session-activity-heading">
            <h2>Atividades</h2>
            <span>{activities.length}</span>
          </div>

          {activities.length ? (
            <ol className="session-activity-list">
              {activities.map((activity, index) => (
                <li key={activity.activityId}>
                  <button
                    type="button"
                    className="session-activity-card"
                    onClick={() => navigate(`/sessions/${session.id}/activities/${activity.activityId}`, {
                      state: { session, activity, programName },
                    })}
                  >
                    <ExerciseMedia
                      src={activity.midiaUrl}
                      alt={`Demonstração de ${activity.nome || `atividade ${index + 1}`}`}
                      className="session-activity-thumbnail"
                      preview
                      fallback={<span className="session-activity-thumbnail session-activity-thumbnail-empty" role="img" aria-label={`Mídia indisponível para ${activity.nome || `atividade ${index + 1}`}`}>
                        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 18v12m5-17v22m22-22v22m5-17v12M13 24h22" /></svg>
                      </span>}
                    />
                    <span className="session-activity-copy">
                      <span>{activity.nome || `Atividade ${index + 1}`}</span>
                      <small className={`session-activity-status status-${String(activity.status || 'PENDING').toLowerCase()}`}>
                        {activity.status === 'COMPLETED' ? 'Concluída' : activity.status === 'INCOMPLETE' ? 'Incompleta' : activity.status === 'IN_PROGRESS' ? 'Em execução' : activity.status === 'PAUSED' ? 'Pausada' : activity.status === 'RESTING' ? 'Em descanso' : 'Pendente'}
                      </small>
                      {getActivityTimeSummary(activity, session, now) && (
                        <small className="session-activity-values">{getActivityTimeSummary(activity, session, now)}</small>
                      )}
                      {activity.prescribed && (
                        <small className="session-activity-values">
                          Prescrito: {Object.entries(activity.prescribed).map(([key, value]) => `${METRICAS_ATIVIDADE[key]?.label || key}: ${value} ${METRICAS_ATIVIDADE[key]?.unidade || ''}`).join(' · ')}
                        </small>
                      )}
                      {activity.executionValues && (
                        <small className="session-activity-values">
                          Executado: {Object.entries(activity.executionValues).map(([key, value]) => `${METRICAS_ATIVIDADE[key]?.label || key}: ${value} ${METRICAS_ATIVIDADE[key]?.unidade || ''}`).join(' · ')}
                        </small>
                      )}
                    </span>
                  </button>
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
