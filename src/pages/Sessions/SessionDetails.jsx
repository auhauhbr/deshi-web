import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/authService.js'
import StudentBottomNav from '../../components/StudentBottomNav.jsx'
import BrandLogo from '../../components/BrandLogo.jsx'
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

function getDurationFromStart(value, now) {
  if (!value) return 0
  const startedAt = new Date(value).getTime()
  return Number.isNaN(startedAt) ? 0 : Math.max(0, now - startedAt)
}

function ExerciseThumbnail({ activity, label }) {
  const [imageFailed, setImageFailed] = useState(false)

  return activity.midiaUrl && !imageFailed ? (
    <img
      className="session-activity-thumbnail"
      src={activity.midiaUrl}
      alt=""
      loading="lazy"
      onError={() => setImageFailed(true)}
    />
  ) : (
    <span className="session-activity-thumbnail session-activity-thumbnail-empty" role="img" aria-label={`Imagem indisponível para ${label}`}>
      <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 18v12m5-17v22m22-22v22m5-17v12M13 24h22" /></svg>
    </span>
  )
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

    return executeSessionAction(resolvedAction)
  }

  return (
    <main className="start-session-page">
      <header className="session-header">
        <div className="session-brand">
          <BrandLogo className="session-brand-logo" to="/home" />
        </div>
        <span className="session-header-label">Sessão de treino</span>
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
                  <button type="button" className="session-secondary-button" disabled={isUpdatingSession} onClick={() => { setShowFinishConfirm(false); setTimeActionMessage('') }}>
                    Voltar ao treino
                  </button>
                  <button type="button" className="session-start-button" disabled={isUpdatingSession} onClick={() => executeSessionAction('finish')}>
                    {isUpdatingSession ? 'Finalizando...' : 'Finalizar mesmo assim'}
                  </button>
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
                    aria-label={`Abrir ${activity.nome || `atividade ${index + 1}`}`}
                  >
                    <ExerciseThumbnail activity={activity} label={activity.nome || `atividade ${index + 1}`} />
                    <span>{activity.nome || `Atividade ${index + 1}`}</span>
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
