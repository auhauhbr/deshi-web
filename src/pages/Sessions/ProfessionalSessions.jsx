import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiErrorMessage, logoutUser } from '../../services/authService.js'
import { getProfessionalStudentSessions } from '../../services/sessionService.js'
import { getLinkedStudents } from '../../services/vinculoService.js'
import './StartSession.css'
import './ProfessionalSessions.css'

const sessionStatusLabels = {
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
  INTERRUPTED: 'Interrompida',
}

function formatStartedAt(value) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date)
}

function ProfessionalSessions() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let isCurrent = true

    async function loadSessions() {
      try {
        setIsLoading(true)
        setMessage('')

        const students = await getLinkedStudents()
        const sessionGroups = await Promise.all(
          students.map(async (student) => {
            const studentSessions = await getProfessionalStudentSessions(student.id)
            return studentSessions.map((session) => ({ session, student }))
          })
        )

        const entries = sessionGroups.flat()
        entries.sort((first, second) => {
          const firstTime = new Date(first.session.startedAt).getTime()
          const secondTime = new Date(second.session.startedAt).getTime()
          const firstHasDate = Number.isFinite(firstTime)
          const secondHasDate = Number.isFinite(secondTime)

          if (!firstHasDate) return secondHasDate ? 1 : 0
          if (!secondHasDate) return -1
          return secondTime - firstTime
        })

        if (isCurrent) setSessions(entries)
      } catch (error) {
        if (isCurrent) {
          setMessage(getApiErrorMessage(error, 'Não foi possível carregar as sessões dos alunos.'))
        }
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    loadSessions()

    return () => {
      isCurrent = false
    }
  }, [])

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logoutUser()
    } finally {
      navigate('/login', {
        replace: true,
        state: { message: 'Você saiu da sua conta com segurança.' },
      })
    }
  }

  return (
    <main className="start-session-page">
      <header className="session-header">
        <div className="session-brand">
          <span className="session-brand-mark">D</span>
          <span>deshi</span>
        </div>
        <div className="professional-header-actions">
          <span className="session-header-label">Área do profissional</span>
          <button
            type="button"
            className="professional-header-action"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Saindo...' : 'Sair'}
          </button>
        </div>
      </header>

      <section className="session-details-content">
        <div className="session-heading">
          <p className="session-eyebrow">ACOMPANHAMENTO</p>
          <h1>Resultados das sessões</h1>
          <p>Consulte as sessões realizadas pelos alunos vinculados a você.</p>
        </div>

        <section className="session-details-card" aria-label="Sessões dos alunos">
          <div className="program-section-heading">
            <div>
              <h2>Sessões disponíveis</h2>
              <p>Os resultados são exibidos conforme os registros da sessão.</p>
            </div>
            {!isLoading && !message && (
              <span className="program-count">
                {sessions.length} {sessions.length === 1 ? 'sessão' : 'sessões'}
              </span>
            )}
          </div>

          {isLoading && (
            <div className="session-feedback" role="status" aria-live="polite">
              Carregando sessões dos alunos...
            </div>
          )}

          {!isLoading && message && (
            <p className="session-message" role="alert">{message}</p>
          )}

          {!isLoading && !message && sessions.length === 0 && (
            <div className="session-empty">
              <span className="empty-icon" aria-hidden="true">◎</span>
              <h3>Nenhuma sessão disponível</h3>
              <p>
                Não há sessões de alunos vinculados disponíveis para consulta.
              </p>
            </div>
          )}

          {!isLoading && !message && sessions.length > 0 && (
            <ul className="professional-session-list">
              {sessions.map(({ session, student }) => {
                const startedAt = formatStartedAt(session.startedAt)

                return (
                  <li key={session.id}>
                    <button
                      type="button"
                      className="professional-session-item"
                      onClick={() => navigate(`/professional/sessions/${session.id}/result`)}
                    >
                      <span className="professional-session-item-main">
                        <strong>{student.name}</strong>
                        <span>
                          {startedAt ? `Iniciada em ${startedAt}` : 'Data não informada'}
                        </span>
                      </span>
                      <span className="professional-session-item-status">
                        {sessionStatusLabels[session.status] || session.status}
                      </span>
                      <span className="professional-session-item-arrow" aria-hidden="true">→</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </section>
    </main>
  )
}

export default ProfessionalSessions
