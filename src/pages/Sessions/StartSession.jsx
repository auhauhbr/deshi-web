import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getStudentPrograms,
  getStudentProfessionals,
  getStudentSessions,
  startSession
} from '../../services/sessionService.js'
import { getApiErrorMessage } from '../../services/authService.js'
import StudentBottomNav from '../../components/StudentBottomNav.jsx'
import StudentButton from '../../components/StudentButton.jsx'
import BrandLogo from '../../components/BrandLogo.jsx'
import './StartSession.css'

function ProgramIcon({ url, completed = false }) {
  const [failed, setFailed] = useState(false)
  if (url && !failed) return <img className="program-card-icon program-card-icon--image" src={url} alt="" onError={() => setFailed(true)} />
  return <div className="program-card-icon" aria-hidden="true">{completed ? '✓' : <svg viewBox="0 0 24 24" fill="none"><path d="M4 9v6m4-9v12m8-12v12m4-9v6M8 12h8" /></svg>}</div>
}

function StartSession() {
  const navigate = useNavigate()

  const [programs, setPrograms] = useState([])
  const [activeSessions, setActiveSessions] = useState([])
  const [completedTodayIds, setCompletedTodayIds] = useState([])
  const [recommendedTodayIds, setRecommendedTodayIds] = useState([])
  const [hasActiveProfessional, setHasActiveProfessional] = useState(null)
  const [selectedProgram, setSelectedProgram] = useState('')
  const [previewProgramId, setPreviewProgramId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [isProgramLoadError, setIsProgramLoadError] = useState(false)
  const [historyWarning, setHistoryWarning] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    let isCurrent = true

    async function loadPrograms() {
      try {
        setIsLoading(true)
        setMessage('')
        setIsProgramLoadError(false)
        setHistoryWarning('')
        setPrograms([])
        setHasActiveProfessional(null)

        const [data, history, professionals] = await Promise.all([
          getStudentPrograms(),
          getStudentSessions().catch((error) => {
            if (isCurrent) {
              setHistoryWarning(getApiErrorMessage(error, 'Não foi possível verificar as sessões concluídas.'))
            }
            return null
          }),
          getStudentProfessionals(),
        ])

        if (!isCurrent) return

        setActiveSessions((history || []).filter((session) => ['IN_PROGRESS', 'PAUSED'].includes(session.status)))

        if (professionals.length === 0) {
          setHasActiveProfessional(false)
          return
        }

        setHasActiveProfessional(true)

        if (!history) {
          setPrograms([])
          return
        }

        setPrograms(data)
        const now = new Date()
        const todayKey = now.toLocaleDateString('sv-SE')
        const monday = new Date(now)
        monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
        monday.setHours(0, 0, 0, 0)
        const weekSessions = history.filter((session) => session.status === 'COMPLETED' && new Date(session.finishedAt || session.startedAt) >= monday)
        const doneToday = [...new Set(weekSessions.filter((session) => new Date(session.finishedAt || session.startedAt).toLocaleDateString('sv-SE') === todayKey).map((session) => String(session.programId)))]
        setCompletedTodayIds(doneToday)
        const weekday = now.getDay()
        const recommended = data.filter((program) => {
          const configuredDays = program.recommendedDays || program.diasRecomendados || program.daysOfWeek || []
          const includesToday = configuredDays.some((day) => Number(day) === weekday || String(day).toLowerCase() === ['domingo','segunda','terça','quarta','quinta','sexta','sábado'][weekday])
          return includesToday || weekSessions.some((session) => String(session.programId) === String(program.id))
        }).map((program) => String(program.id))
        setRecommendedTodayIds(recommended)
      } catch (error) {
        if (isCurrent) {
          setIsProgramLoadError(true)
          setMessage(getApiErrorMessage(error, 'Não foi possível carregar seus programas.'))
        }
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    loadPrograms()
    return () => { isCurrent = false }
  }, [loadAttempt])

async function handleStartSession(event, programId = selectedProgram) {
  event?.preventDefault()

  if (!programId) {
    setMessage('Selecione um programa para iniciar sua sessão.')
    return
  }

  try {
    setIsSubmitting(true)
    setMessage('')

    setSelectedProgram(programId)
    const session = await startSession(programId)
    const selectedProgramData = programs.find((program) => String(program.id) === String(programId))
    if (session && Array.isArray(session.activities)) {
      session.activities = session.activities.map((activity) => {
        const source = selectedProgramData?.activities?.find((item) => String(item.activityId) === String(activity.activityId))
        return {
          ...activity,
          nome: activity.nome || source?.nome,
            midiaUrl: activity.midiaUrl || source?.midiaUrl,
            grupoMuscular: activity.grupoMuscular || source?.grupoMuscular,
          prescribed: activity.prescribed || source?.prescribed,
        }
      })
    }

    if (!session?.id) {
      setMessage('A API iniciou a sessão, mas não retornou o identificador esperado.')
      return
    }

    navigate(`/sessions/${session.id}`, {
      replace: true,
      state: { session, programName: selectedProgramData?.name }
    })
  } catch (error) {
    setMessage(
      getApiErrorMessage(
        error,
        'Não foi possível iniciar a sessão. Tente novamente.'
      )
    )
  } finally {
    setIsSubmitting(false)
  }
}


  return (
    <main className="start-session-page programs-page">
      <header className="session-header programs-header">
        <div className="session-brand">
          <BrandLogo className="session-brand-logo" variant="adaptive" to="/home" />
        </div>
      </header>

      <section className="start-session-content">
        <div className="session-heading programs-heading">
          <p className="session-eyebrow">SUA ROTINA ESPORTIVA</p>
          <h1>Seus programas</h1>
        </div>

        <form
          className="program-selection"
          onSubmit={handleStartSession}
        >
          {!isLoading && activeSessions.length > 0 && <section className="active-session-resume" aria-labelledby="active-session-title">
            <div className="active-session-resume__heading">
              <span className="active-session-resume__indicator" aria-hidden="true" />
              <div>
                <h2 id="active-session-title">Sessão em andamento</h2>
                <p>Você pode voltar para onde parou.</p>
              </div>
            </div>
            <div className="active-session-resume__list">
              {activeSessions.map((session) => {
                const program = programs.find((item) => String(item.id) === String(session.programId))
                const completedCount = session.activities?.filter((activity) => activity.status === 'COMPLETED').length || 0
                return <Link
                  key={session.id}
                  className="active-session-card"
                  to={`/sessions/${session.id}`}
                  state={{ session, programName: program?.name }}
                  aria-label={`Retomar ${program?.name || 'sessão de treino'}${session.status === 'PAUSED' ? ', pausada' : ''}`}
                >
                  <span className="active-session-card__mark" aria-hidden="true">↗</span>
                  <span className="active-session-card__copy">
                    <strong>{program?.name || 'Sessão de treino'}</strong>
                    <span>{session.status === 'PAUSED' ? 'Pausada' : 'Em andamento'} · {completedCount} de {session.activities?.length || 0} atividades concluídas</span>
                  </span>
                  <span className="active-session-card__action">Retomar <span aria-hidden="true">→</span></span>
                </Link>
              })}
            </div>
          </section>}
          {!isLoading && !historyWarning && recommendedTodayIds.length > 0 && <section className="program-recommendations" aria-labelledby="recommended-programs-title">
            <div className="program-section-heading"><div><h2 id="recommended-programs-title">Recomendados para hoje</h2><p>{recommendedTodayIds.every((id) => completedTodayIds.includes(id)) ? 'Você já concluiu os treinos recomendados de hoje. Muito bem!' : 'Treinos indicados para manter sua rotina nesta semana.'}</p></div></div>
            <div className="program-grid">{programs.filter((program) => recommendedTodayIds.includes(String(program.id))).map((program) => <article key={`recommended-${program.id}`} className={`program-card${completedTodayIds.includes(String(program.id)) ? ' is-done' : ''}`} role="button" tabIndex={0} onClick={() => navigate(`/sessions/preview/${program.id}`, { state: { program, returnTo: '/sessions/start' } })} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') navigate(`/sessions/preview/${program.id}`, { state: { program, returnTo: '/sessions/start' } }) }}><div className="program-card-choice"><ProgramIcon url={program.iconeUrl} completed={completedTodayIds.includes(String(program.id))} /><div className="program-card-content"><h3>{program.name}</h3><p>{completedTodayIds.includes(String(program.id)) ? 'Concluído hoje · toque para repetir' : `${program.activities?.length ?? 0} atividades · toque para visualizar`}</p><p className="program-professional">{program.professionalName || 'Programa do seu profissional'}</p></div></div></article>)}</div>
          </section>}
          {previewProgramId && programs.some((program) => String(program.id) === previewProgramId) && <StudentButton variant="secondary" onClick={() => navigate(`/sessions/preview/${previewProgramId}`, { state: { program: programs.find((item) => String(item.id) === previewProgramId), returnTo: '/sessions/start' } })}>Visualizar programa</StudentButton>}
          <div className="program-section-heading">
            <div>
                  <h2>Seus programas</h2>
              <p>Todos os programas que seus profissionais passaram para você.</p>
            </div>

            {!isLoading && (
              <span className="program-count">
                {programs.length} {programs.length === 1 ? 'programa' : 'programas'}
              </span>
            )}
          </div>

          {isLoading && (
            <div className="session-feedback">
              Carregando seus programas...
            </div>
          )}

          {!isLoading && historyWarning && (
            <div className="session-empty" role="alert">
              <h3>Não foi possível atualizar seus programas</h3>
              <p>{historyWarning}</p>
              <StudentButton variant="secondary" onClick={() => { setHistoryWarning(''); setIsLoading(true); setLoadAttempt((attempt) => attempt + 1) }}>
                Tentar novamente
              </StudentButton>
            </div>
          )}

          {!isLoading && !historyWarning && !isProgramLoadError && programs.length === 0 && (
            <div className="session-empty">
              {!hasActiveProfessional ? (
                <>
                  <span className="empty-icon">◎</span>
                  <h3>Vincule-se a um profissional</h3>
                  <p>Seus programas aparecerão aqui quando você estiver vinculado a um profissional e receber um programa.</p>
                  <Link className="completed-program-link" to="/invites/accept">Vincular profissional <span aria-hidden="true">→</span></Link>
                </>
              ) : (
                <>
                  <span className="empty-icon">◎</span>
                  <h3>Nenhum programa disponível</h3>
                  <p>
                    Você ainda não possui programas disponíveis.
                    Entre em contato com seu profissional responsável.
                  </p>
                </>
              )}
            </div>
          )}

          {!isLoading && !historyWarning && !isProgramLoadError && programs.length > 0 && (
            <div className="program-grid">
              {programs.map((program) => (
                <article
                  key={program.id}
                  className={`program-card ${
                    selectedProgram === program.id ? 'selected' : ''
                  }`}
                  role="button"
                  tabIndex={isSubmitting ? -1 : 0}
                  aria-label={`Iniciar sessão de ${program.name}`}
                  onClick={() => navigate(`/sessions/preview/${program.id}`, { state: { program, returnTo: '/sessions/start' } })}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return
                    if (event.key === 'Enter' || event.key === ' ') navigate(`/sessions/preview/${program.id}`, { state: { program, returnTo: '/sessions/start' } })
                  }}
                >
                  <label className="program-card-choice">
                    <input
                      type="radio"
                      name="program"
                      value={program.id}
                      checked={selectedProgram === program.id}
                      onChange={() => {
                        setSelectedProgram(program.id)
                        setMessage('')
                      }}
                    />
                    <ProgramIcon url={program.iconeUrl} />
                    <div className="program-card-content">
                      <h3>{program.name}</h3>
                      <p>{program.description || `${program.activities?.length ?? 0} ${program.activities?.length === 1 ? 'atividade' : 'atividades'} neste programa.`}</p>
                      <p className="program-professional">Profissional: {program.professionalName || 'não informado'}</p>
                    </div>
                  </label>
                  <span className="program-start-button" aria-hidden="true">
                    {isSubmitting && selectedProgram === program.id
                      ? <span className="program-start-spinner" />
                      : <svg className="program-start-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>}
                  </span>
                </article>
              ))}
            </div>
          )}

          {message && (
            <div className="session-message-history" role="alert">
              <p>{message}</p>
              {isProgramLoadError && (
                <StudentButton variant="secondary" onClick={() => { setMessage(''); setIsLoading(true); setLoadAttempt((attempt) => attempt + 1) }}>
                  Tentar novamente
                </StudentButton>
              )}
            </div>
          )}

        </form>
      </section>
      <StudentBottomNav active="todo" />
    </main>
  )
}

export default StartSession
