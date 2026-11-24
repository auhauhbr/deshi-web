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

function StartSession() {
  const navigate = useNavigate()

  const [programs, setPrograms] = useState([])
  const [completedProgramsCount, setCompletedProgramsCount] = useState(0)
  const [hasActiveProfessional, setHasActiveProfessional] = useState(null)
  const [selectedProgram, setSelectedProgram] = useState('')
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
        setCompletedProgramsCount(0)
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

        if (professionals.length === 0) {
          setHasActiveProfessional(false)
          return
        }

        setHasActiveProfessional(true)

        if (!history) {
          setPrograms([])
          setCompletedProgramsCount(0)
          return
        }

        const completedProgramIds = new Set(
          history
            .filter((session) => session.status === 'COMPLETED' && session.programId != null)
            .map((session) => String(session.programId)),
        )
        const availablePrograms = data.filter((program) => !completedProgramIds.has(String(program.id)))

        setPrograms(availablePrograms)
        setCompletedProgramsCount(data.length - availablePrograms.length)
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
          <BrandLogo className="session-brand-logo" to="/home" />
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
          <div className="program-section-heading">
            <div>
              <h2>Programas disponíveis</h2>
              <p>Toque no botão ao lado para iniciar.</p>
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
              ) : completedProgramsCount > 0 ? (
                <>
                  <span className="empty-icon">✓</span>
                  <h3>Todos os programas foram concluídos</h3>
                  <p>Os programas com sessões concluídas não aparecem mais nesta lista.</p>
                  <Link className="completed-program-link" to="/sessions/completed">Ver histórico de treinos <span aria-hidden="true">→</span></Link>
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
                  onClick={(event) => handleStartSession(event, program.id)}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return
                    if (event.key === 'Enter' || event.key === ' ') handleStartSession(event, program.id)
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
                    <div className="program-card-icon" aria-hidden="true"><span>↗</span></div>
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
