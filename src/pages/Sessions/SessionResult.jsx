import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/authService.js'
import { getProfessionalActivities } from '../../services/activityService.js'
import { getSessionResult } from '../../services/sessionService.js'
import './StartSession.css'
import './SessionDetails.css'
import './ProfessionalSessions.css'

const sessionStatusLabels = {
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
  INTERRUPTED: 'Interrompida',
}

const activityStatusLabels = {
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
  PENDING: 'Pendente',
  PAUSED: 'Pausada',
  RESTING: 'Em descanso',
  INCOMPLETE: 'Incompleta',
}

const metricLabels = {
  series: { label: 'Séries', unit: 'séries', singularUnit: 'série' },
  sets: { label: 'Séries', unit: 'séries', singularUnit: 'série' },
  repeticoes: { label: 'Repetições', unit: 'repetições', singularUnit: 'repetição' },
  repetitions: { label: 'Repetições', unit: 'repetições', singularUnit: 'repetição' },
  cargaKg: { label: 'Carga', suffix: 'kg' },
  weight: { label: 'Carga', suffix: 'kg' },
  carga: { label: 'Carga', suffix: 'kg' },
  peso: { label: 'Peso', suffix: 'kg' },
  pesoKg: { label: 'Peso', suffix: 'kg' },
  duration: { label: 'Duração', duration: true },
  duracao: { label: 'Duração', duration: true },
  duracaoSegundos: { label: 'Duração', duration: true },
  duracaoRoundSegundos: { label: 'Duração da rodada', duration: true },
  descanso: { label: 'Tempo de descanso', duration: true },
  descansoSegundos: { label: 'Tempo de descanso', duration: true },
  rest: { label: 'Tempo de descanso', duration: true },
  restSeconds: { label: 'Tempo de descanso', duration: true },
  rounds: { label: 'Rodadas', unit: 'rodadas', singularUnit: 'rodada' },
  distance: { label: 'Distância', suffix: 'm' },
  distancia: { label: 'Distância', suffix: 'm' },
  distanciaMetros: { label: 'Distância', suffix: 'm' },
  speed: { label: 'Velocidade', suffix: 'km/h' },
  velocidade: { label: 'Velocidade', suffix: 'km/h' },
}

function formatDateTime(value) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date)
}

function formatDuration(milliseconds) {
  if (typeof milliseconds !== 'number' || !Number.isFinite(milliseconds) || milliseconds < 0) {
    return null
  }

  const totalSeconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

function formatElapsedSeconds(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null

  const isNegative = value < 0
  const totalSeconds = Math.floor(Math.abs(value))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts = []

  if (hours) parts.push(`${hours} h`)
  if (minutes) parts.push(`${minutes} min`)
  if (seconds || parts.length === 0) parts.push(`${seconds} s`)

  return `${isNegative ? '-' : ''}${parts.join(' ')}`
}

function getEntries(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? Object.entries(value)
    : []
}

function formatValue(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  return null
}

function getMetricLabel(metric) {
  return metricLabels[metric]?.label || null
}

function formatMetricValue(metric, value) {
  const formattedValue = formatValue(value)
  if (formattedValue === null) return null

  const definition = metricLabels[metric]
  if (definition?.duration) return formatElapsedSeconds(value)
  if (definition?.unit) {
    const unit = Math.abs(Number(value)) === 1
      ? definition.singularUnit
      : definition.unit
    return `${formattedValue} ${unit}`
  }
  if (definition?.suffix) return `${formattedValue} ${definition.suffix}`

  return formattedValue
}

function ActivityValues({ title, values, sectionClassName }) {
  const entries = getEntries(values)
    .filter(([metric]) => metricLabels[metric])
    .map(([metric, value]) => [metric, getMetricLabel(metric), formatMetricValue(metric, value)])
    .filter(([, label, value]) => label && value !== null)

  if (entries.length === 0) return null

  return (
    <section className={`result-value-section ${sectionClassName}`}>
      <h4>{title}</h4>
      <dl className="result-metric-list">
        {entries.map(([metric, label, value]) => (
          <div className="result-metric" key={metric}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function ActivityComparison({ comparison }) {
  const entries = getEntries(comparison).filter(([metric, values]) => (
    metricLabels[metric] &&
    values && typeof values === 'object' && !Array.isArray(values) &&
    (formatValue(values.prescribed) !== null || formatValue(values.executed) !== null)
  ))
  const labeledEntries = entries.map(([metric, values]) => [metric, values, getMetricLabel(metric)])

  if (labeledEntries.length === 0) return null

  return (
    <section className="result-comparison-section">
      <h4>Comparação entre prescrição e execução</h4>
      <ul className="result-comparison-list">
        {labeledEntries.map(([metric, values, label]) => {
          const prescribed = formatMetricValue(metric, values.prescribed)
          const executed = formatMetricValue(metric, values.executed)
          const difference = formatMetricValue(metric, values.difference)
          const canCompareValues = typeof values.prescribed === 'number' &&
            Number.isFinite(values.prescribed) &&
            typeof values.executed === 'number' &&
            Number.isFinite(values.executed)
          const outcome = canCompareValues
            ? values.executed < values.prescribed
              ? { label: 'Abaixo do prescrito', className: 'is-different' }
              : values.executed > values.prescribed
                ? { label: 'Acima do prescrito', className: 'is-different' }
                : { label: 'Conforme o prescrito', className: 'is-equal' }
            : null

          return (
            <li className="result-comparison-card" key={metric}>
              <h5>{label}</h5>
              <div className="result-comparison-values">
                {prescribed !== null && (
                  <div>
                    <span>Prescrito</span>
                    <strong>{prescribed}</strong>
                  </div>
                )}
                {executed !== null && (
                  <div>
                    <span>Executado</span>
                    <strong>{executed}</strong>
                  </div>
                )}
              </div>
              {difference !== null && (
                <p className="result-comparison-difference">
                  <strong>Diferença:</strong> {difference}.
                </p>
              )}
              {outcome && (
                <span className={`result-comparison-outcome ${outcome.className}`}>
                  {outcome.label}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function ActivityTimes({ timeTracking }) {
  if (!timeTracking || typeof timeTracking !== 'object') return null

  const durations = [
    ['Tempo ativo', timeTracking.activeTimeMs],
    ['Tempo de pausa', timeTracking.pauseTimeMs],
    ['Tempo de descanso', timeTracking.restTimeMs],
  ].map(([label, duration]) => [label, formatDuration(duration)])
    .filter(([, duration]) => duration !== null)

  if (durations.length === 0) return null

  return (
    <section className="result-times-section" aria-label="Tempos do exercício">
      <h4>Tempos registrados</h4>
      <dl className="result-time-cards">
        {durations.map(([label, duration]) => (
          <div className="result-time-card" key={label}>
            <dt>{label}</dt>
            <dd>{duration}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function ActivityObservations({ observations }) {
  const recorded = Array.isArray(observations)
    ? observations.filter((observation) => typeof observation === 'string' && observation.trim())
    : []

  if (recorded.length === 0) return null

  return (
    <section className="result-observations">
      <h4>Observações</h4>
      <ul>
        {recorded.map((observation, index) => (
          <li key={`${observation}-${index}`}>{observation}</li>
        ))}
      </ul>
    </section>
  )
}

function ExerciseResult({ activity, index, name }) {
  const order = Number.isFinite(activity.order) ? activity.order : index + 1
  const status = activityStatusLabels[activity.status] || null
  const statusClass = activity.status?.toLowerCase() || 'unknown'

  return (
    <li className="result-exercise-card">
      <header className="result-exercise-header">
        <span className="result-exercise-number">{order}</span>
        <h3>{name || `Exercício ${order}`}</h3>
        {status && (
          <span className={`result-status-badge result-activity-status result-status-${statusClass}`}>
            {status}
          </span>
        )}
      </header>

      <div className="result-value-columns">
        <ActivityValues
          title="Prescrição"
          values={activity.prescribed}
          sectionClassName="is-prescribed"
        />
        <ActivityValues
          title="Execução"
          values={activity.execution?.values}
          sectionClassName="is-executed"
        />
      </div>

      <ActivityComparison comparison={activity.comparison} />
      <ActivityTimes timeTracking={activity.timeTracking} />
      <ActivityObservations observations={activity.observations} />
    </li>
  )
}

function SessionResult() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [resultState, setResultState] = useState(null)

  useEffect(() => {
    let isCurrent = true

    async function loadResult() {
      const [resultResponse, activitiesResponse] = await Promise.allSettled([
        getSessionResult(sessionId),
        getProfessionalActivities(),
      ])

      if (!isCurrent) return

      if (resultResponse.status === 'rejected') {
        setResultState({
          sessionId,
          isLoading: false,
          message: getApiErrorMessage(
            resultResponse.reason,
            'Não foi possível carregar o resultado da sessão.'
          ),
        })
        return
      }

      const result = resultResponse.value
      if (!result || typeof result !== 'object' || Array.isArray(result)) {
        setResultState({
          sessionId,
          isLoading: false,
          message: 'A API não retornou os dados esperados para esta sessão.',
        })
        return
      }

      let names = {}
      let namesMessage = ''
      if (activitiesResponse.status === 'fulfilled' && Array.isArray(activitiesResponse.value)) {
        names = Object.fromEntries(
          activitiesResponse.value
            .filter((activity) => activity?.id && activity?.nome)
            .map((activity) => [activity.id, activity.nome])
        )
      } else {
        const error = activitiesResponse.status === 'rejected'
          ? activitiesResponse.reason
          : new Error('A API não retornou o catálogo de exercícios esperado.')
        namesMessage = getApiErrorMessage(error, 'Os nomes dos exercícios não puderam ser carregados.')
      }

      setResultState({
        sessionId,
        isLoading: false,
        message: '',
        session: result,
        activityNames: names,
        activityNamesMessage: namesMessage,
      })
    }

    loadResult()

    return () => {
      isCurrent = false
    }
  }, [sessionId])

  const currentResult = resultState?.sessionId === sessionId ? resultState : null
  const isLoading = !currentResult || currentResult.isLoading
  const session = currentResult?.session || null
  const message = currentResult?.message || ''
  const activityNames = currentResult?.activityNames || {}
  const activityNamesMessage = currentResult?.activityNamesMessage || ''
  const activities = Array.isArray(session?.activities) ? session.activities : []
  const startedAt = formatDateTime(session?.startedAt)
  const finishedAt = formatDateTime(session?.finishedAt)
  const duration = formatDuration(session?.durationMs)
  const sessionStatus = sessionStatusLabels[session?.status] || null

  return (
    <main className="start-session-page session-result-page">
      <header className="session-header">
        <div className="session-brand">
          <span className="session-brand-mark">D</span>
          <span>deshi</span>
        </div>
        <span className="session-header-label">Resultado da sessão</span>
      </header>

      <section className="session-details-content">
        <button
          type="button"
          className="session-secondary-button professional-back-button"
          onClick={() => navigate('/professional/sessions')}
        >
          ← Voltar às sessões
        </button>

        {isLoading && (
          <div className="session-details-card" role="status" aria-live="polite">
            <p>Carregando resultado da sessão...</p>
          </div>
        )}

        {!isLoading && message && (
          <div className="session-details-card">
            <h1>Não foi possível carregar esta sessão</h1>
            <p className="session-message" role="alert">{message}</p>
          </div>
        )}

        {!isLoading && !message && session && (
          <>
            <div className="result-page-heading">
              <p className="session-eyebrow">RESULTADO DA SESSÃO</p>
              <div>
                <h1>Resultado da sessão</h1>
                {sessionStatus && (
                  <span className={`result-status-badge result-session-status result-status-${session.status.toLowerCase()}`}>
                    {sessionStatus}
                  </span>
                )}
              </div>
            </div>

            {activityNamesMessage && (
              <p className="result-catalog-notice" role="status">
                {activityNamesMessage} Os exercícios serão identificados pela ordem da sessão.
              </p>
            )}

            <section className="session-result-panel" aria-label="Dados da sessão">
              <div className="result-session-summary">
                {(startedAt || finishedAt) && (
                  <dl className="result-session-dates">
                    {startedAt && (
                      <div>
                        <dt>Iniciada em</dt>
                        <dd>{startedAt}</dd>
                      </div>
                    )}
                    {finishedAt && (
                      <div>
                        <dt>Encerrada em</dt>
                        <dd>{finishedAt}</dd>
                      </div>
                    )}
                  </dl>
                )}
                {duration !== null && (
                  <div className="result-total-duration">
                    <span>Duração total da sessão</span>
                    <strong>{duration}</strong>
                  </div>
                )}
              </div>

              <div className="result-exercises-heading">
                <div>
                  <p className="session-eyebrow">ACOMPANHAMENTO DO TREINO</p>
                  <h2>Exercícios realizados</h2>
                </div>
                <span>{activities.length} {activities.length === 1 ? 'exercício' : 'exercícios'}</span>
              </div>

              {activities.length === 0 ? (
                <p className="session-activity-empty">Nenhum exercício registrado nesta sessão.</p>
              ) : (
                <ol className="result-exercise-list">
                  {activities.map((activity, index) => (
                    <ExerciseResult
                      activity={activity}
                      index={index}
                      key={activity.activityId || `${session.id}-${index}`}
                      name={activityNames[activity.activityId]}
                    />
                  ))}
                </ol>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  )
}

export default SessionResult
