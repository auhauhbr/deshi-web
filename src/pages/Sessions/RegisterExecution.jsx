import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/authService.js'
import StudentBottomNav from '../../components/StudentBottomNav.jsx'
import StudentButton from '../../components/StudentButton.jsx'
import BrandLogo from '../../components/BrandLogo.jsx'
import { getStudentSessions, registerExecution } from '../../services/sessionService.js'
import { METRICAS_ATIVIDADE } from '../../utils/metricas-atividade.js'
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
  const prescribedMetricKeys = Object.keys(activity?.prescribed || {}).filter((key) => Object.hasOwn(METRICAS_ATIVIDADE, key))
  const metricOptions = prescribedMetricKeys.length ? prescribedMetricKeys : Object.keys(METRICAS_ATIVIDADE)

  useEffect(() => {
    const prescribedValues = activity?.prescribed
    if (!prescribedValues || typeof prescribedValues !== 'object' || Array.isArray(prescribedValues)) return

    const prescribedKeys = Object.keys(prescribedValues).filter((key) => Object.hasOwn(METRICAS_ATIVIDADE, key))
    if (prescribedKeys.length) {
      setFields(prescribedKeys.map((name, index) => ({ id: index + 1, name, value: '' })))
    }
  }, [activity])

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
    setFields((current) => {
      const nextName = metricOptions.find((key) => !current.some((field) => field.name === key))
      if (!nextName) return current

      const emptyField = current.find((field) => !field.name)
      if (emptyField) {
        return current.map((field) => field.id === emptyField.id ? { ...field, name: nextName } : field)
      }

      return [...current, { id: Math.max(0, ...current.map((field) => field.id)) + 1, name: nextName, value: '' }]
    })
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
      setMessage('Selecione um indicador e informe o valor realizado.')
      return
    }

    if (normalizedFields.some((field) => !Number.isFinite(Number(field.value)))) {
      setMessage('Os valores dos indicadores devem ser numéricos.')
      return
    }

    const invalidMetric = normalizedFields.find((field) => {
      const metric = METRICAS_ATIVIDADE[field.name]
      const value = Number(field.value)
      return !metric
        || (metric.tipo !== 'decimal' && !Number.isSafeInteger(value))
        || (metric.min !== undefined && value < metric.min)
    })
    if (invalidMetric) {
      setMessage(`Confira o valor de ${METRICAS_ATIVIDADE[invalidMetric.name]?.label || 'cada indicador'} e a unidade.`)
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
            activities: updatedSession.activities.map((updatedActivity) => {
              const currentActivity = session.activities.find((item) => item.activityId === updatedActivity.activityId)
              return {
                ...updatedActivity,
                nome: updatedActivity.nome || currentActivity?.nome,
                descricao: updatedActivity.descricao || currentActivity?.descricao,
                midiaUrl: updatedActivity.midiaUrl || currentActivity?.midiaUrl,
                prescribed: updatedActivity.prescribed || currentActivity?.prescribed,
                executionValues: updatedActivity.executionValues
                  || (String(updatedActivity.activityId) === String(activityId) ? values : currentActivity?.executionValues),
              }
            }),
          },
          programName: state?.programName,
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
          <div className="session-brand"><BrandLogo className="session-brand-logo" to="/home" /></div>
        </header>
        <section className="session-details-content">
          <div className="session-details-card" role="status" aria-live="polite">
            {isLoading ? 'Carregando atividade...' : message || 'Atividade indisponível.'}
          </div>
        </section>
        <StudentBottomNav active="todo" />
      </main>
    )
  }

  return (
    <main className="start-session-page">
      <header className="session-header">
        <div className="session-brand"><BrandLogo className="session-brand-logo" to="/home" /></div>
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
          {activity.prescribed && Object.keys(activity.prescribed).length > 0 && (
            <dl className="execution-prescription-list" aria-label="Valores prescritos">
              {Object.entries(activity.prescribed)
                .filter(([key]) => Object.hasOwn(METRICAS_ATIVIDADE, key))
                .map(([key, value]) => (
                  <div key={key}>
                    <dt>{METRICAS_ATIVIDADE[key].label}</dt>
                    <dd>{value} {METRICAS_ATIVIDADE[key].unidade}</dd>
                  </div>
                ))}
            </dl>
          )}

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
              <p>Os indicadores seguem a prescrição da atividade e usam unidades padronizadas.</p>
            </div>
            <StudentButton
              variant="secondary"
              className="execution-add-field"
              onClick={addField}
              disabled={fields.length >= metricOptions.length}
            >
              Adicionar indicador
            </StudentButton>
          </div>

          <div className="execution-fields-list">
            {fields.map((field, index) => (
              <div className="execution-field-row" key={field.id}>
                <div className="execution-input">
                  <label htmlFor={`execution-name-${field.id}`}>Indicador {index + 1}</label>
                  <select id={`execution-name-${field.id}`} value={field.name} onChange={(event) => updateField(field.id, 'name', event.target.value)} required>
                    <option value="">Selecione um indicador</option>
                    {metricOptions.map((key) => {
                      const metric = METRICAS_ATIVIDADE[key]
                      return (
                      <option key={key} value={key} disabled={fields.some((item) => item.id !== field.id && item.name === key)}>
                        {metric.label} ({metric.unidade})
                      </option>
                      )
                    })}
                  </select>
                </div>
                <div className="execution-input">
                  <label htmlFor={`execution-value-${field.id}`}>
                    {METRICAS_ATIVIDADE[field.name]?.label || 'Valor'} ({METRICAS_ATIVIDADE[field.name]?.unidade || 'unidade'})
                  </label>
                  <input
                    id={`execution-value-${field.id}`}
                    type="number"
                    step={METRICAS_ATIVIDADE[field.name]?.tipo === 'inteiro' ? '1' : 'any'}
                    min={METRICAS_ATIVIDADE[field.name]?.min}
                    value={field.value}
                    onChange={(event) => updateField(field.id, 'value', event.target.value)}
                    placeholder="Informe o valor realizado"
                    required
                  />
                </div>
                {fields.length > 1 && (
                  <StudentButton variant="secondary" className="execution-remove-field" onClick={() => removeField(field.id)} aria-label={`Remover indicador ${index + 1}`}>
                    Remover
                  </StudentButton>
                )}
              </div>
            ))}
          </div>

          {message && <p className="session-message" role="alert">{message}</p>}

          <div className="execution-actions">
            <StudentButton variant="secondary" className="session-secondary-button" onClick={() => navigate(`/sessions/${sessionId}`, { state: { session, programName: state?.programName } })} disabled={isSubmitting}>Voltar à sessão</StudentButton>
            <StudentButton type="submit" particles className="session-start-button" busy={isSubmitting}>
              {isSubmitting ? 'Salvando execução...' : 'Salvar execução'}
            </StudentButton>
          </div>
        </form>
      </section>
      <StudentBottomNav active="todo" />
    </main>
  )
}

export default RegisterExecution
