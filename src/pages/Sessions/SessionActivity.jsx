import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/authService.js'
import StudentButton from '../../components/StudentButton.jsx'
import StudentAccountMenu from '../../components/StudentAccountMenu.jsx'
import {
  completeActivity,
  endActivityRest,
  getStudentSessions,
  pauseActivity,
  resumeActivity,
  startActivity,
  startActivityRest,
} from '../../services/sessionService.js'
import './SessionActivity.css'

function formatClock(milliseconds = 0) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60
  return hours
    ? [hours, minutes, remainder].map((part) => String(part).padStart(2, '0')).join(':')
    : [minutes, remainder].map((part) => String(part).padStart(2, '0')).join(':')
}

function elapsedSince(value, now) {
  if (!value) return 0
  const startedAt = new Date(value).getTime()
  return Number.isFinite(startedAt) ? Math.max(0, now - startedAt) : 0
}

function ActionIcon({ kind }) {
  if (kind === 'play') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7z" /></svg>
  if (kind === 'check') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7" /></svg>
  if (kind === 'rest') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v3m0 12v3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1M3 12h3m12 0h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /><circle cx="12" cy="12" r="5" /></svg>
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" /></svg>
}

function ExerciseFallback({ label }) {
  return (
    <div className="activity-player-no-media" role="img" aria-label={`Imagem não cadastrada para ${label}`}>
      <svg viewBox="0 0 72 72" aria-hidden="true"><path d="M13 28v16m8-24v32m30-32v32m8-24v16M21 36h30" /></svg>
      <span>Imagem não cadastrada</span>
    </div>
  )
}

function SessionActivity() {
  const { sessionId, activityId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const cachedSession = state?.session?.id === sessionId ? state.session : null
  const cachedActivity = state?.activity?.activityId === activityId ? state.activity : null
  const [session, setSession] = useState(cachedSession)
  const [activity, setActivity] = useState(cachedActivity)
  const [loading, setLoading] = useState(!cachedSession || !cachedActivity)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [imageFailed, setImageFailed] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (cachedSession && cachedActivity) return undefined
    let current = true

    async function loadActivity() {
      try {
        const sessions = cachedSession ? [] : await getStudentSessions()
        const foundSession = cachedSession || sessions.find((item) => item.id === sessionId)
        const foundActivity = cachedActivity || foundSession?.activities?.find((item) => item.activityId === activityId)
        if (!foundSession || !foundActivity) {
          if (current) setMessage('Não foi possível encontrar esta atividade na sessão.')
          return
        }
        if (current) {
          setSession(foundSession)
          setActivity(foundActivity)
        }
      } catch (error) {
        if (current) setMessage(getApiErrorMessage(error, 'Não foi possível carregar a atividade.'))
      } finally {
        if (current) setLoading(false)
      }
    }

    loadActivity()
    return () => { current = false }
  }, [activityId, cachedActivity, cachedSession, sessionId])

  useEffect(() => {
    if (session?.status !== 'IN_PROGRESS' || !['IN_PROGRESS', 'PAUSED', 'RESTING'].includes(activity?.status)) return undefined
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [activity?.status, session?.status])

  async function runAction(action) {
    if (!session || !activity || session.status !== 'IN_PROGRESS') return
    setBusy(true)
    setMessage('')
    try {
      const updatedSession = await action(session.id, activity.activityId)
      const nextActivity = updatedSession.activities.find((item) => item.activityId === activity.activityId)
      const activityWithMetadata = {
        ...nextActivity,
        nome: nextActivity?.nome || activity.nome,
        descricao: nextActivity?.descricao || activity.descricao,
        midiaUrl: nextActivity?.midiaUrl || activity.midiaUrl,
        prescribed: nextActivity?.prescribed || activity.prescribed,
        executionValues: nextActivity?.executionValues || activity.executionValues,
      }
      const sessionWithMetadata = {
        ...updatedSession,
        professionalName: updatedSession.professionalName || session.professionalName,
        activities: updatedSession.activities.map((item) => item.activityId === activity.activityId ? activityWithMetadata : item),
      }
      setSession(sessionWithMetadata)
      setActivity(activityWithMetadata)
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Não foi possível atualizar a atividade. Tente novamente.'))
    } finally {
      setBusy(false)
    }
  }

  function returnToSession(nextSession = session, nextActivity = activity) {
    navigate(`/sessions/${sessionId}`, {
      state: {
        session: nextSession,
        programName: state?.programName,
        activity: nextActivity,
      },
    })
  }

  if (loading || !activity || !session) {
    return (
      <main className="activity-player-page activity-player-loading">
        <button type="button" className="activity-player-back" onClick={() => navigate(`/sessions/${sessionId}`)} aria-label="Voltar ao treino">←</button>
        <p role={loading ? 'status' : 'alert'}>{loading ? 'Carregando atividade...' : message || 'Atividade indisponível.'}</p>
      </main>
    )
  }

  const label = activity.nome || 'Atividade'
  const tracking = activity.timeTracking || {}
  const elapsedActive = (tracking.activeTimeMs || 0) + (activity.status === 'IN_PROGRESS' && session.status === 'IN_PROGRESS'
    ? elapsedSince(tracking.activeStartedAt, now)
    : 0)
  const elapsedPause = (tracking.pauseTimeMs || 0) + (activity.status === 'PAUSED' && session.status === 'IN_PROGRESS'
    ? elapsedSince(tracking.pauseStartedAt, now)
    : 0)
  const elapsedRest = (tracking.restTimeMs || 0) + (activity.status === 'RESTING' && session.status === 'IN_PROGRESS'
    ? elapsedSince(tracking.restStartedAt, now)
    : 0)
  const activityTime = activity.status === 'RESTING'
    ? elapsedRest
    : activity.status === 'PAUSED' ? elapsedPause : elapsedActive
  const isSessionPaused = session.status === 'PAUSED'
  const mainAction = activity.status === 'PENDING'
    ? { action: startActivity, label: 'Iniciar atividade', icon: 'play' }
    : activity.status === 'IN_PROGRESS'
      ? { action: pauseActivity, label: 'Pausar atividade', icon: 'pause' }
      : activity.status === 'PAUSED'
        ? { action: resumeActivity, label: 'Retomar atividade', icon: 'play' }
        : activity.status === 'RESTING'
          ? { action: endActivityRest, label: 'Encerrar descanso', icon: 'play' }
          : null
  const canComplete = ['IN_PROGRESS', 'PAUSED', 'RESTING'].includes(activity.status)
  const canRest = activity.status === 'IN_PROGRESS'
  function openExecutionForm() {
    navigate(`/sessions/${sessionId}/executions/${activity.activityId}`, {
      state: { session, activity, programName: state?.programName },
    })
  }

  return (
    <main className="activity-player-page">
      <div className="activity-player-backdrop" aria-hidden="true">
        {activity.midiaUrl && !imageFailed
          ? <img src={activity.midiaUrl} alt="" onError={() => setImageFailed(true)} />
          : <ExerciseFallback label={label} />}
      </div>
      <div className="activity-player-scrim" aria-hidden="true" />

      <header className="activity-player-header">
        <button type="button" className="activity-player-back" onClick={() => returnToSession()} aria-label="Voltar ao treino">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <span>ATIVIDADE {activity.order}</span>
      </header>
      <StudentAccountMenu />

      <section className="activity-player-main" aria-label={label}>
        <div className="activity-player-title">
          <span className={`activity-state-pill state-${activity.status.toLowerCase()}`}>
            {activity.status === 'PENDING' ? 'Pronta para começar' : activity.status === 'IN_PROGRESS' ? 'Em execução' : activity.status === 'PAUSED' ? 'Pausada' : activity.status === 'RESTING' ? 'Em descanso' : activity.status === 'COMPLETED' ? 'Concluída' : 'Incompleta'}
          </span>
          <h1>{label}</h1>
          {activity.descricao && <p>{activity.descricao}</p>}
        </div>

        <div className="activity-player-controls">
          <div className="activity-player-clock" aria-live="off">
            <strong>{formatClock(activityTime)}</strong>
            <span>{activity.status === 'RESTING' ? 'Descanso' : activity.status === 'PAUSED' ? 'Pausa' : 'Tempo de execução'}</span>
          </div>

          {isSessionPaused ? (
            <p className="activity-session-paused-note" role="status">O treino está pausado. Retome a sessão para usar os controles desta atividade.</p>
          ) : (
            <>
              {mainAction && (
                <StudentButton variant="primary" className="activity-main-action" onClick={() => runAction(mainAction.action)} busy={busy}>
                  {busy ? <span className="activity-action-spinner" aria-hidden="true" /> : <ActionIcon kind={mainAction.icon} />}
                  {busy ? 'Atualizando...' : mainAction.label}
                </StudentButton>
              )}

              <div className="activity-secondary-actions">
                {canRest && (
                  <StudentButton variant="secondary" onClick={() => runAction(startActivityRest)} disabled={busy}>
                    <ActionIcon kind="rest" /> Iniciar descanso
                  </StudentButton>
                )}
                {canComplete && (
                  <StudentButton variant="secondary" particles onClick={() => runAction(completeActivity)} disabled={busy}>
                    <ActionIcon kind="check" /> Concluir atividade
                  </StudentButton>
                )}
                {['COMPLETED', 'INCOMPLETE'].includes(activity.status) && session.status === 'IN_PROGRESS' && (
                  <StudentButton variant="secondary" onClick={openExecutionForm} disabled={busy}>
                    Registrar execução
                  </StudentButton>
                )}
              </div>
            </>
          )}

          {message && <p className="activity-player-message" role="alert">{message}</p>}
        </div>
      </section>
    </main>
  )
}

export default SessionActivity
