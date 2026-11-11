import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getStudentPrograms,
  getStudentSessions,
  startSession
} from '../../services/sessionService.js'
import { getApiErrorMessage } from '../../services/authService.js'
import StudentBottomNav from '../../components/StudentBottomNav.jsx'
import BrandLogo from '../../components/BrandLogo.jsx'
import './StartSession.css'

function StartSession() {
  const navigate = useNavigate()

  const [programs, setPrograms] = useState([])
  const [completedProgramsCount, setCompletedProgramsCount] = useState(0)
  const [selectedProgram, setSelectedProgram] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [historyWarning, setHistoryWarning] = useState('')

  useEffect(() => {
    let isCurrent = true

    async function loadPrograms() {
      try {
        setIsLoading(true)
        setMessage('')
        setHistoryWarning('')

        const [data, history] = await Promise.all([
          getStudentPrograms(),
          getStudentSessions().catch((error) => {
            if (isCurrent) {
              setHistoryWarning(getApiErrorMessage(error, 'Não foi possível verificar as sessões concluídas.'))
            }
            return null
          }),
        ])

        if (!isCurrent) return

        if (!history) {
          setPrograms(data)
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
        if (isCurrent) setMessage(getApiErrorMessage(error, 'Não foi possível carregar seus programas.'))
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    loadPrograms()
    return () => { isCurrent = false }
  }, [])

async function handleStartSession(event) {
  event.preventDefault()

  if (!selectedProgram) {
    setMessage('Selecione um programa para iniciar sua sessão.')
    return
  }

  try {
    setIsSubmitting(true)
    setMessage('')

    const session = await startSession(selectedProgram)

    if (!session?.id) {
      setMessage('A API iniciou a sessão, mas não retornou o identificador esperado.')
      return
    }

    navigate(`/sessions/${session.id}`, {
      replace: true,
      state: { session }
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
    <main className="start-session-page">
      <header className="session-header">
        <div className="session-brand">
          <BrandLogo className="session-brand-logo" />
        </div>

        <span className="session-header-label">
          Área do aluno
        </span>
      </header>

      <section className="start-session-content">
        <div className="session-heading">
          <p className="session-eyebrow">SUA ROTINA ESPORTIVA</p>

          <h1>Vamos começar?</h1>

          <p>
            Escolha um dos seus programas e prepare-se para iniciar
            uma nova sessão de treino.
          </p>
        </div>

        <form
          className="program-selection"
          onSubmit={handleStartSession}
        >
          <div className="program-section-heading">
            <div>
              <h2>Seus programas</h2>
              <p>Selecione o programa que deseja realizar.</p>
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

          {!isLoading && programs.length === 0 && (
            <div className="session-empty">
              {completedProgramsCount > 0 ? (
                <>
                  <span className="empty-icon">✓</span>
                  <h3>Todos os programas foram concluídos</h3>
                  <p>Os programas com sessões concluídas não aparecem mais nesta lista.</p>
                  <Link className="completed-program-link" to="/sessions/completed">Ver sessões concluídas <span aria-hidden="true">→</span></Link>
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

          {!isLoading && programs.length > 0 && (
            <div className="program-grid">
              {programs.map((program) => (
                <label
                  key={program.id}
                  className={`program-card ${
                    selectedProgram === program.id ? 'selected' : ''
                  }`}
                >
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

                  <div className="program-card-icon">
                    <span>↗</span>
                  </div>

                  <div className="program-card-content">
                    <h3>{program.name}</h3>

                    <p>
                      {program.description ||
                        `${program.activities?.length ?? 0} ${program.activities?.length === 1 ? 'atividade' : 'atividades'} neste programa.`}
                    </p>
                    <p className="program-professional">
                      Profissional responsável: {program.professionalName || 'não informado'}
                    </p>
                  </div>

                  <span className="program-radio-indicator" />
                </label>
              ))}
            </div>
          )}

          {message && (
            <p className="session-message" role="alert">
              {message}
            </p>
          )}

          {historyWarning && (
            <p className="session-history-warning" role="status">
              {historyWarning} Programas concluídos podem continuar aparecendo.
            </p>
          )}

          <div className="session-actions">
            <button
              className="session-start-button"
              type="submit"
              disabled={
                isLoading ||
                programs.length === 0 ||
                !selectedProgram ||
                isSubmitting
              }
            >
              {isSubmitting ? 'Iniciando sessão...' : 'Iniciar sessão'}
              {!isSubmitting && <span>→</span>}
            </button>

            <p>
              Ao iniciar, o sistema registrará o horário e
              carregará as atividades do programa.
            </p>
          </div>
        </form>
      </section>
      <StudentBottomNav active="todo" />
    </main>
  )
}

export default StartSession
