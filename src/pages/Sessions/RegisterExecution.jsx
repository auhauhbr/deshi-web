import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/authService.js'
import { getStudentSessions, registerExecution } from '../../services/sessionService.js'
import './StartSession.css'
import './SessionDetails.css'
import './RegisterExecution.css'

function RegisterExecution() {
  const { sessionId, activityId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const [session, setSession] = useState(
    state?.session?.id === sessionId ? state.session : null,
  )
  const [activity, setActivity] = useState(
    state?.activity?.activityId === activityId ? state.activity : null,
  )
  const [fields, setFields] = useState([{ id: 1, name: '', value: '' }])
  const [status, setStatus] = useState('COMPLETED')
  const [isLoading, setIsLoading] = useState(!session || !activity)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (session && activity) return

    let isCurrent = true

    async function loadSessionActivity() {
      try {
        const sessions = await getStudentSessions()
        const foundSession = sessions.find((item) => item.id === sessionId)
        const foundActivity = foundSession?.activities?.find(
          (item) => item.activityId === activityId,
        )

        if (isCurrent) {
          if (foundSession && foundActivity) {
            setSession(foundSession)
            setActivity(foundActivity)
          } else {
            setMessage('A atividade não foi encontrada nesta sessão.')
          }
        }
      } catch (error) {
        if (isCurrent) {
          setMessage(getApiErrorMessage(error, 'Não foi possível carregar a atividade.'))
        }
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    loadSessionActivity()

    return () => {
      isCurrent = false
    }
  }, [activity, activityId, session, sessionId])

  function updateField(id, key, value) {
    setFields((current) => current.map((field) => (
      field.id === id ? { ...field, [key]: value } : field
    )))
  }

  function addField() {
    setFields((current) => [
      ...current,
      { id: Math.max(0, ...current.map((field) => field.id)) + 1, name: '', value: '' },
    ])
  }

  function removeField(id) {
    setFields((current) => current.filter((field) => field.id !== id))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    const normalizedFields = fields.map((field) => ({
      ...field,
      name: field.name.trim(),
    }))

    if (!normalizedFields.length || normalizedFields.some((field) => !field.name || field.value === '')) {
      setMessage('Informe o nome e o valor de cada indicador.')
      return
    }

    if (normalizedFields.some((field) => !Number.isFinite(Number(field.value)))) {
      setMessage('Os valores dos indicadores devem ser numéricos.')
      return
    }

    const names = normalizedFields.map((field) => field.name.toLocaleLowerCase('pt-BR'))
    if (new Set(names).size !== names.length) {
      setMessage('Cada indicador deve ter um nome diferente.')
      return
    }

    try {
      setIsSubmitting(true)
      const values = Object.fromEntries(
        normalizedFields.map((field) => [field.name, Number(field.value)]),
      )
      const updatedSession = await registerExecution(sessionId, {
        activityId,
        values,
        status,
      })

      navigate(`/sessions/${sessionId}`, {
        replace: true,
        state: {
          session: {
            ...updatedSession,
            professionalName: updatedSession.professionalName || session.professionalName,
          },
        },
      })
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Não foi possível registrar a execução.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !session || !activity) {
    return (
      <main className="start-session-page">
        <header className="session-header">
          <div className="session-brand"><span className="session-brand-mark">D</span><span>deshi</span></div>
          <span className="session-header-label">Área do aluno</span>
        </header>
        <section className="session-details-content">
          <div className="session-details-card" role="status" aria-live="polite">
            {isLoading ? 'Carregando atividade...' : message || 'Atividade indisponível.'}
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="start-session-page">
      <header className="session-header">
        <div className="session-brand"><span className="session-brand-mark">D</span><span>deshi</span></div>
        <span className="session-header-label">Registro de execução</span>
      </header>

      <section className="session-details-content">
        <div className="session-heading">
          <p className="session-eyebrow">ATIVIDADE {activity.order}</p>
          <h1>Como foi sua execução?</h1>
          <p>Registre os indicadores numéricos realizados nesta atividade.</p>
        </div>

        <form className="execution-form session-details-card" onSubmit={handleSubmit}>
          <div className="execution-activity-id">Identificador da atividade: {activity.activityId}</div>
          <p className="execution-prescription-note">
            Os valores serão salvos nesta sessão e não alteram a prescrição original do programa.
          </p>

          <fieldset className="execution-status-fieldset">
            <legend>Resultado da atividade</legend>
            <div className="execution-status-options">
              <label className={status === 'COMPLETED' ? 'selected' : ''}>
                <input type="radio" name="execution-status" value="COMPLETED" checked={status === 'COMPLETED'} onChange={() => setStatus('COMPLETED')} />
                Concluída
              </label>
              <label className={status === 'INCOMPLETE' ? 'selected' : ''}>
                <input type="radio" name="execution-status" value="INCOMPLETE" checked={status === 'INCOMPLETE'} onChange={() => setStatus('INCOMPLETE')} />
                Incompleta
              </label>
            </div>
          </fieldset>

          <div className="execution-fields-heading">
            <div>
              <h2>Indicadores</h2>
              <p>Use os nomes de campo definidos para esta atividade.</p>
            </div>
            <button type="button" className="execution-add-field" onClick={addField}>Adicionar indicador</button>
          </div>

          <div className="execution-fields-list">
            {fields.map((field, index) => (
              <div className="execution-field-row" key={field.id}>
                <div className="execution-input">
                  <label htmlFor={`execution-name-${field.id}`}>Indicador {index + 1}</label>
                  <input id={`execution-name-${field.id}`} type="text" value={field.name} onChange={(event) => updateField(field.id, 'name', event.target.value)} placeholder="Ex.: repetições" required />
                </div>
                <div className="execution-input">
                  <label htmlFor={`execution-value-${field.id}`}>Valor numérico</label>
                  <input id={`execution-value-${field.id}`} type="number" step="any" value={field.value} onChange={(event) => updateField(field.id, 'value', event.target.value)} placeholder="Ex.: 12" required />
                </div>
                {fields.length > 1 && (
                  <button type="button" className="execution-remove-field" onClick={() => removeField(field.id)} aria-label={`Remover indicador ${index + 1}`}>Remover</button>
                )}
              </div>
            ))}
          </div>

          {message && <p className="session-message" role="alert">{message}</p>}

          <div className="execution-actions">
            <button type="button" className="session-secondary-button" onClick={() => navigate(`/sessions/${sessionId}`, { state: { session } })} disabled={isSubmitting}>Voltar à sessão</button>
            <button type="submit" className="session-start-button" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando execução...' : 'Salvar execução'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}

export default RegisterExecution
