import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/authService.js'
import StudentButton from '../../components/StudentButton.jsx'
import StudentAccountMenu from '../../components/StudentAccountMenu.jsx'
import ExerciseMedia from '../../components/ExerciseMedia.jsx'
import { METRICAS_ATIVIDADE } from '../../utils/metricas-atividade.js'
import {
  completeActivity,
  endActivityRest,
  getStudentSessions,
  pauseActivity,
  resumeActivity,
  startActivity,
  startActivityRest,
  registerExecution,
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

function playCue(frequency = 740) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return
    const context = new AudioContextClass()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.12, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.22)
    oscillator.onended = () => context.close()
  } catch { /* Audio is an optional cue; the visual state remains available. */ }
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
  const isPreviewMode = Boolean(state?.previewMode)
  const previewReturnTo = state?.returnTo || `/sessions/${sessionId}`
  const cachedSession = state?.session?.id === sessionId ? state.session : null
  const cachedActivity = state?.activity?.activityId === activityId ? state.activity : null
  const [session, setSession] = useState(cachedSession)
  const [activity, setActivity] = useState(cachedActivity)
  const [loading, setLoading] = useState(!cachedSession || !cachedActivity)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [now, setNow] = useState(Date.now())
  const [reps, setReps] = useState('')
  const [load, setLoad] = useState('')
  const [lastSeries, setLastSeries] = useState(null)
  const [seriesStartedAt, setSeriesStartedAt] = useState(Date.now())
  const roundAlarmed = useRef(false)
  const [roundStartedAt, setRoundStartedAt] = useState(null)
  const [roundReady, setRoundReady] = useState(false)

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

  const isRoundBased = Number(activity?.prescribed?.rounds) > 0 || Number(activity?.prescribed?.duracaoRoundSegundos) > 0
  const prescribedSets = Math.max(1, Number(isRoundBased ? activity?.prescribed?.rounds : activity?.prescribed?.series) || 1)
  const roundDurationSeconds = Math.max(1, Number(activity?.prescribed?.duracaoRoundSegundos) || Number(activity?.prescribed?.duracaoSegundos) || 1)
  const restSeconds = Math.max(0, Number(activity?.prescribed?.descansoSegundos) || 0)
  const recordedSets = activity?.execution?.series?.length || 0
  const activeSet = Math.min(recordedSets + 1, prescribedSets)
  const restRemaining = Math.max(0, restSeconds - Math.floor(elapsedSince(activity?.timeTracking?.restStartedAt, now) / 1000))
  const roundRemaining = Math.max(0, roundDurationSeconds - Math.floor(elapsedSince(roundStartedAt || activity?.timeTracking?.activeStartedAt, now) / 1000))

  useEffect(() => {
    if (!isRoundBased || activity?.status !== 'IN_PROGRESS' || roundReady) { roundAlarmed.current = false; return }
    if (roundRemaining === 0 && !roundAlarmed.current) { roundAlarmed.current = true; playCue(990) }
  }, [isRoundBased, activity?.status, roundRemaining, roundReady])

  useEffect(() => {
    if (activity?.status !== 'RESTING' || !restSeconds || restRemaining > 0 || busy) return
    runAction(endActivityRest)
    playCue(880)
  }, [activity?.status, restSeconds, restRemaining, busy])

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
        grupoMuscular: nextActivity?.grupoMuscular || activity.grupoMuscular,
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
      if (isRoundBased && (action === startActivity || action === endActivityRest)) {
        setRoundStartedAt(Date.now())
        setRoundReady(false)
      }
      if (activity.status === 'RESTING' && action === endActivityRest) playCue(880)
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Não foi possível atualizar a atividade. Tente novamente.'))
    } finally {
      setBusy(false)
    }
  }

  function returnToSession(nextSession = session, nextActivity = activity) {
    if (isPreviewMode) {
      navigate(previewReturnTo, { state: { program: state?.program || null, returnTo: '/sessions/start' } })
      return
    }
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

  async function saveSet() {
    const repetitionCount = Number(reps)
    const weight = Number(load)
    if (!Number.isInteger(repetitionCount) || repetitionCount < 1 || !Number.isFinite(weight) || weight < 0) {
      setMessage('Informe as repetições e uma carga válida para esta série.')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      const finalSet = activeSet >= prescribedSets
    if (finalSet) {
      setLastSeries({ number: activeSet, values: { repeticoes: repetitionCount, cargaKg: weight }, durationMs: Math.max(0, Date.now() - seriesStartedAt), restMs: 0 })
      navigate(`/sessions/${session.id}/executions/${activity.activityId}`, { state: { session, activity, programName: state?.programName, finalSeries: { number: activeSet, values: { repeticoes: repetitionCount, cargaKg: weight }, durationMs: Math.max(0, Date.now() - seriesStartedAt), restMs: 0 } } })
      return
    }
      const updatedSession = await registerExecution(session.id, {
        activityId: activity.activityId,
        seriesNumber: activeSet,
        values: { repeticoes: repetitionCount, cargaKg: weight },
      durationMs: Math.max(0, Date.now() - seriesStartedAt),
      status: 'IN_PROGRESS',
      })
      const updatedActivity = updatedSession.activities.find((item) => item.activityId === activity.activityId)
      setSession(updatedSession)
      setActivity({ ...updatedActivity, nome: activity.nome, descricao: activity.descricao, midiaUrl: activity.midiaUrl, prescribed: activity.prescribed })
      setReps('')
      setLoad('')
    setSeriesStartedAt(Date.now())
      playCue(finalSet ? 990 : 620)
      if (finalSet) setMessage('Todas as séries concluídas. Atividade finalizada!')
      else if (restSeconds) await runAction(startActivityRest)
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Não foi possível registrar esta série.'))
    } finally { setBusy(false) }
  }

  async function finishRound() {
    if (roundRemaining > 0 || busy) return
    setBusy(true)
    setMessage('')
    try {
      const finalRound = activeSet >= prescribedSets
      const values = { duracaoRoundSegundos: roundDurationSeconds }
      const finalSeries = { number: activeSet, values, durationMs: roundDurationSeconds * 1000, restMs: 0 }
      if (finalRound) {
        navigate(`/sessions/${session.id}/executions/${activity.activityId}`, { state: { session, activity, programName: state?.programName, finalSeries } })
        return
      }
      const updated = await registerExecution(session.id, { activityId: activity.activityId, seriesNumber: activeSet, values, durationMs: roundDurationSeconds * 1000, status: 'IN_PROGRESS' })
      const nextActivity = updated.activities.find((item) => item.activityId === activity.activityId)
      const merged = { ...nextActivity, nome: activity.nome, descricao: activity.descricao, midiaUrl: activity.midiaUrl, prescribed: activity.prescribed }
      setSession({ ...updated, activities: updated.activities.map((item) => item.activityId === activity.activityId ? merged : item) })
      setActivity(merged)
      setSeriesStartedAt(Date.now())
      roundAlarmed.current = false
      if (restSeconds) await runAction(startActivityRest)
      else setRoundReady(true)
    } catch (error) { setMessage(getApiErrorMessage(error, 'Não foi possível registrar o round.')) }
    finally { setBusy(false) }
  }

  function startNextRound() {
    setRoundStartedAt(Date.now())
    setRoundReady(false)
    roundAlarmed.current = false
    setNow(Date.now())
  }


  return (
    <main className="activity-player-page">
      <div className="activity-player-backdrop" aria-hidden="true">
        <ExerciseMedia
          src={activity.midiaUrl}
          alt=""
          preview
          fallback={<ExerciseFallback label={label} />}
        />
      </div>
      <div className="activity-player-scrim" aria-hidden="true" />

      <header className="activity-player-header">
        <button type="button" className={`activity-player-back${isPreviewMode ? ' activity-player-back--preview' : ''}`} onClick={() => returnToSession()} aria-label="Voltar ao programa">
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

        {activity.status === 'PENDING' && activity.prescribed && Object.keys(activity.prescribed).length > 0 && (
          <dl className="activity-prescription" aria-label="Prescrição do profissional">
            {Object.entries(activity.prescribed).filter(([key]) => Object.hasOwn(METRICAS_ATIVIDADE, key)).map(([key, value]) => (
              <div key={key}><dt>{METRICAS_ATIVIDADE[key].label}</dt><dd>{value} {METRICAS_ATIVIDADE[key].unidade}</dd></div>
            ))}
          </dl>
        )}

        {['IN_PROGRESS', 'RESTING'].includes(activity.status) && (
          <section className="activity-set-panel" aria-label="Registro das séries">
            <div className="activity-set-heading"><span>{isRoundBased ? 'ROUND' : 'SÉRIE'} {activeSet} DE {prescribedSets}</span><strong>{activity.status === 'RESTING' ? formatClock(restRemaining * 1000) : isRoundBased ? formatClock(roundRemaining * 1000) : `${activity.prescribed?.repeticoes || '—'} repetições`}</strong></div>
            {activity.status === 'RESTING' ? <p role="status">Descanso. O próximo round começa automaticamente ao fim do cronômetro.</p> : isRoundBased ? <>
              <p role="status">{roundReady ? 'Pronto para começar o próximo round.' : roundRemaining ? 'Execute o round no seu ritmo.' : 'Round concluído. Toque para registrar e continuar.'}</p>
              {roundReady ? <StudentButton variant="primary" className="activity-main-action" onClick={startNextRound} disabled={busy}>Iniciar round {activeSet}</StudentButton> : <StudentButton variant="primary" className="activity-main-action" onClick={finishRound} disabled={busy || roundRemaining > 0}>{activeSet >= prescribedSets ? 'Terminar último round' : restSeconds ? 'Terminar round e descansar' : 'Terminar round'}</StudentButton>}
            </> : <>
              <label>Repetições realizadas<input type="number" min="1" step="1" value={reps} onChange={(event) => setReps(event.target.value)} placeholder={String(activity.prescribed?.repeticoes || '')} /></label>
              <label>Carga utilizada (kg)<input type="number" min="0" step="0.5" value={load} onChange={(event) => setLoad(event.target.value)} placeholder={String(activity.prescribed?.cargaKg ?? 0)} /></label>
              <StudentButton variant="primary" className="activity-main-action" onClick={saveSet} disabled={busy}>{activeSet < prescribedSets && restSeconds ? 'Registrar série e descansar' : activeSet < prescribedSets ? 'Registrar série' : 'Concluir atividade'}</StudentButton>
            </>}
          </section>
        )}

        {!isPreviewMode && <div className="activity-player-controls">
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
        </div>}
      </section>
    </main>
  )
}

export default SessionActivity
