import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/authService.js'
import { getStudentEvolution } from '../../services/evolutionService.js'
import { getLinkedStudents } from '../../services/vinculoService.js'
import './StartSession.css'
import './StudentEvolution.css'

const metricDefinitions = {
  series: { label: 'Séries', unit: 'séries', singularUnit: 'série' },
  repeticoes: { label: 'Repetições', unit: 'repetições', singularUnit: 'repetição' },
  cargaKg: { label: 'Carga', unit: 'kg' },
  duracaoSegundos: { label: 'Duração', unit: 's' },
  quantidade: { label: 'Quantidade', unit: 'unidades' },
  descansoSegundos: { label: 'Tempo de descanso', unit: 's' },
  distanciaMetros: { label: 'Distância', unit: 'm' },
  rounds: { label: 'Rodadas', unit: 'rodadas', singularUnit: 'rodada' },
  duracaoRoundSegundos: { label: 'Duração da rodada', unit: 's' },
}

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
})

function getMetricLabel(metric) {
  return metricDefinitions[metric]?.label || metric
}

function formatMetricValue(metric, value) {
  const definition = metricDefinitions[metric]
  const formattedValue = numberFormatter.format(value)

  if (!definition?.unit) return formattedValue

  const unit = value === 1 && definition.singularUnit
    ? definition.singularUnit
    : definition.unit

  return `${formattedValue} ${unit}`
}

function formatDate(value) {
  return dateTimeFormatter.format(new Date(value))
}

function getCalendarDate(value) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
}

function validateEvolutionResponse(data, studentId) {
  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    typeof data.studentId !== 'string' ||
    data.studentId !== studentId ||
    !Array.isArray(data.evolution)
  ) {
    throw new Error('A API não retornou os dados esperados para a evolução.')
  }

  return data.evolution.map((group) => {
    if (
      !group ||
      typeof group !== 'object' ||
      Array.isArray(group) ||
      typeof group.activityId !== 'string' ||
      typeof group.metric !== 'string' ||
      (group.activityName !== undefined && typeof group.activityName !== 'string') ||
      (group.modalityId !== undefined && typeof group.modalityId !== 'string') ||
      (group.modalityName !== undefined && typeof group.modalityName !== 'string') ||
      !Array.isArray(group.points)
    ) {
      throw new Error('A API retornou um grupo de evolução inválido.')
    }

    const points = group.points
      .map((point) => {
        if (
          !point ||
          typeof point !== 'object' ||
          Array.isArray(point) ||
          typeof point.sessionId !== 'string' ||
          typeof point.value !== 'number' ||
          !Number.isFinite(point.value) ||
          typeof point.executedAt !== 'string' ||
          Number.isNaN(Date.parse(point.executedAt))
        ) {
          throw new Error('A API retornou um registro de evolução inválido.')
        }

        return point
      })
      .sort((first, second) => (
        Date.parse(first.executedAt) - Date.parse(second.executedAt)
      ))

    return { ...group, points }
  }).filter((group) => group.points.length > 0)
}

function EvolutionChart({ activityName, metric, points }) {
  const chartWidth = 720
  const chartHeight = 250
  const padding = { top: 24, right: 24, bottom: 40, left: 64 }
  const values = points.map((point) => point.value)
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const plotWidth = chartWidth - padding.left - padding.right
  const plotHeight = chartHeight - padding.top - padding.bottom
  const coordinates = points.map((point, index) => {
    const x = padding.left + (index / (points.length - 1)) * plotWidth
    const y = padding.top + (
      maximum === minimum
        ? plotHeight / 2
        : ((maximum - point.value) / (maximum - minimum)) * plotHeight
    )

    return { x, y, point }
  })
  const polylinePoints = coordinates
    .map(({ x, y }) => `${x},${y}`)
    .join(' ')
  const dateLabels = [
    { point: points[0], x: padding.left, anchor: 'start' },
    { point: points[points.length - 1], x: chartWidth - padding.right, anchor: 'end' },
  ]

  return (
    <figure className="evolution-chart">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label={`Gráfico de ${getMetricLabel(metric)} para ${activityName}`}
      >
        <title>{`${getMetricLabel(metric)} — ${activityName}`}</title>
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={chartHeight - padding.bottom}
          className="evolution-chart-axis"
        />
        <line
          x1={padding.left}
          y1={chartHeight - padding.bottom}
          x2={chartWidth - padding.right}
          y2={chartHeight - padding.bottom}
          className="evolution-chart-axis"
        />
        <text x={padding.left - 10} y={padding.top + 5} textAnchor="end">
          {numberFormatter.format(maximum)}
        </text>
        <text
          x={padding.left - 10}
          y={chartHeight - padding.bottom}
          textAnchor="end"
        >
          {numberFormatter.format(minimum)}
        </text>
        <polyline points={polylinePoints} className="evolution-chart-line" />
        {coordinates.map(({ x, y, point }) => (
          <circle key={`${point.sessionId}-${point.executedAt}`} cx={x} cy={y} r="5">
            <title>{`${formatDate(point.executedAt)}: ${formatMetricValue(metric, point.value)}`}</title>
          </circle>
        ))}
        {dateLabels.map(({ point, x, anchor }) => (
          <text
            key={`${point.sessionId}-${anchor}`}
            x={x}
            y={chartHeight - 12}
            textAnchor={anchor}
          >
            {formatDate(point.executedAt)}
          </text>
        ))}
      </svg>
      <figcaption>
        Evolução de {getMetricLabel(metric).toLocaleLowerCase('pt-BR')} ao longo do tempo.
      </figcaption>
    </figure>
  )
}

function EvolutionGroup({ group }) {
  const activityName = group.activityName || 'Atividade não informada pela API'
  const distinctDates = new Set(group.points.map((point) => getCalendarDate(point.executedAt))).size
  const hasEnoughDates = distinctDates >= 2

  return (
    <article className="evolution-group">
      <header className="evolution-group-heading">
        <div>
          <h3>{activityName}</h3>
          {group.modalityName && (
            <p className="evolution-modality">{group.modalityName}</p>
          )}
        </div>
        <span className="evolution-metric-badge">{getMetricLabel(group.metric)}</span>
      </header>

      {hasEnoughDates ? (
        <EvolutionChart
          activityName={activityName}
          metric={group.metric}
          points={group.points}
        />
      ) : (
        <p className="evolution-insufficient" role="status">
          Ainda não há registros em datas diferentes suficientes para demonstrar a evolução.
          Os valores registrados estão listados abaixo.
        </p>
      )}

      <ul className="evolution-point-list">
        {group.points.map((point) => (
          <li key={`${point.sessionId}-${point.executedAt}`}>
            <time dateTime={point.executedAt}>{formatDate(point.executedAt)}</time>
            <strong>{formatMetricValue(group.metric, point.value)}</strong>
          </li>
        ))}
      </ul>
    </article>
  )
}

function StudentEvolution() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [studentsError, setStudentsError] = useState('')
  const [studentRetry, setStudentRetry] = useState(0)
  const [allEvolution, setAllEvolution] = useState([])
  const [visibleEvolution, setVisibleEvolution] = useState([])
  const [activityFilter, setActivityFilter] = useState('')
  const [metricFilter, setMetricFilter] = useState('')
  const [evolutionLoading, setEvolutionLoading] = useState(false)
  const [evolutionError, setEvolutionError] = useState('')
  const [evolutionRetry, setEvolutionRetry] = useState(0)

  useEffect(() => {
    let isCurrent = true

    async function loadStudents() {
      try {
        setStudentsLoading(true)
        setStudentsError('')
        const linkedStudents = await getLinkedStudents()

        if (!Array.isArray(linkedStudents)) {
          throw new Error('A API não retornou uma lista de alunos válida.')
        }

        if (isCurrent) {
          setStudents(linkedStudents)
          setSelectedStudentId((current) => (
            linkedStudents.some((student) => student.id === current)
              ? current
              : linkedStudents[0]?.id || ''
          ))
        }
      } catch (error) {
        if (isCurrent) {
          setStudentsError(getApiErrorMessage(error, 'Não foi possível carregar os alunos vinculados.'))
        }
      } finally {
        if (isCurrent) setStudentsLoading(false)
      }
    }

    loadStudents()

    return () => {
      isCurrent = false
    }
  }, [studentRetry])

  useEffect(() => {
    if (!selectedStudentId) return undefined

    let isCurrent = true

    async function loadEvolution() {
      try {
        setEvolutionLoading(true)
        setEvolutionError('')
        const filters = {
          ...(activityFilter ? { activityId: activityFilter } : {}),
          ...(metricFilter ? { metric: metricFilter } : {}),
        }
        const response = await getStudentEvolution(selectedStudentId, filters)
        const groups = validateEvolutionResponse(response, selectedStudentId)

        if (isCurrent) {
          if (!activityFilter && !metricFilter) setAllEvolution(groups)
          setVisibleEvolution(groups)
        }
      } catch (error) {
        if (isCurrent) {
          setEvolutionError(getApiErrorMessage(error, 'Não foi possível carregar a evolução deste aluno.'))
        }
      } finally {
        if (isCurrent) setEvolutionLoading(false)
      }
    }

    loadEvolution()

    return () => {
      isCurrent = false
    }
  }, [selectedStudentId, activityFilter, metricFilter, evolutionRetry])

  const selectedStudent = students.find((student) => student.id === selectedStudentId)
  const activities = useMemo(() => {
    const uniqueActivities = new Map()

    for (const group of allEvolution) {
      if (!uniqueActivities.has(group.activityId)) {
        uniqueActivities.set(group.activityId, {
          id: group.activityId,
          name: group.activityName || 'Atividade não informada pela API',
          modalityName: group.modalityName,
        })
      }
    }

    return [...uniqueActivities.values()]
  }, [allEvolution])

  const availableMetrics = useMemo(() => {
    const matchingGroups = activityFilter
      ? allEvolution.filter((group) => group.activityId === activityFilter)
      : allEvolution

    return [...new Set(matchingGroups.map((group) => group.metric))]
  }, [allEvolution, activityFilter])

  const showNoEvolution = (
    !evolutionLoading &&
    !evolutionError &&
    allEvolution.length === 0
  )
  const showNoFilteredResults = (
    !evolutionLoading &&
    !evolutionError &&
    allEvolution.length > 0 &&
    visibleEvolution.length === 0
  )
  const showEvolutionResults = (
    !evolutionLoading &&
    !evolutionError &&
    visibleEvolution.length > 0
  )

  function handleStudentChange(event) {
    setSelectedStudentId(event.target.value)
    setActivityFilter('')
    setMetricFilter('')
    setAllEvolution([])
    setVisibleEvolution([])
  }

  function handleActivityChange(event) {
    setActivityFilter(event.target.value)
    setMetricFilter('')
  }

  return (
    <main className="start-session-page student-evolution-page">
      <header className="session-header">
        <div className="session-brand">
          <span className="session-brand-mark">D</span>
          <span>deshi</span>
        </div>
        <button
          type="button"
          className="professional-header-action"
          onClick={() => navigate('/professional/sessions')}
        >
          Voltar às sessões
        </button>
      </header>

      <section className="session-details-content">
        <div className="session-heading">
          <p className="session-eyebrow">ACOMPANHAMENTO</p>
          <h1>Evolução do aluno</h1>
          <p>Consulte as métricas registradas nas atividades ao longo do tempo.</p>
        </div>

        <section className="session-details-card evolution-panel" aria-label="Evolução do aluno">
          <div className="evolution-controls">
            <div className="evolution-field">
              <label htmlFor="evolution-student">Aluno</label>
              <select
                id="evolution-student"
                value={selectedStudentId}
                onChange={handleStudentChange}
                disabled={studentsLoading || students.length === 0}
              >
                <option value="">Selecione um aluno</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name || student.email || 'Aluno sem nome informado'}
                  </option>
                ))}
              </select>
            </div>

            {selectedStudentId && (
              <>
                <div className="evolution-field">
                  <label htmlFor="evolution-activity">Atividade</label>
                  <select
                    id="evolution-activity"
                    value={activityFilter}
                    onChange={handleActivityChange}
                    disabled={activities.length === 0}
                  >
                    <option value="">Todas as atividades</option>
                    {activities.map((activity) => (
                      <option key={activity.id} value={activity.id}>
                        {activity.modalityName
                          ? `${activity.name} — ${activity.modalityName}`
                          : activity.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="evolution-field">
                  <label htmlFor="evolution-metric">Métrica</label>
                  <select
                    id="evolution-metric"
                    value={metricFilter}
                    onChange={(event) => setMetricFilter(event.target.value)}
                    disabled={availableMetrics.length === 0}
                  >
                    <option value="">Todas as métricas</option>
                    {availableMetrics.map((metric) => (
                      <option key={metric} value={metric}>
                        {getMetricLabel(metric)}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          {studentsLoading && (
            <p className="session-feedback" role="status" aria-live="polite">
              Carregando alunos vinculados...
            </p>
          )}

          {!studentsLoading && studentsError && (
            <div className="evolution-message evolution-error" role="alert">
              <p>{studentsError}</p>
              <button
                type="button"
                className="professional-header-action"
                onClick={() => setStudentRetry((retry) => retry + 1)}
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!studentsLoading && !studentsError && students.length === 0 && (
            <p className="evolution-message" role="status">
              Nenhum aluno vinculado foi disponibilizado pela API para consulta.
            </p>
          )}

          {selectedStudent && (
            <div className="evolution-results" aria-live="polite">
              <div className="evolution-student-heading">
                <h2>{selectedStudent.name || selectedStudent.email}</h2>
                {selectedStudent.email && selectedStudent.name && (
                  <p>{selectedStudent.email}</p>
                )}
              </div>

              {evolutionLoading && (
                <p className="session-feedback" role="status">
                  Carregando métricas...
                </p>
              )}

              {!evolutionLoading && evolutionError && (
                <div className="evolution-message evolution-error" role="alert">
                  <p>{evolutionError}</p>
                  <button
                    type="button"
                    className="professional-header-action"
                    onClick={() => setEvolutionRetry((retry) => retry + 1)}
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              {showNoEvolution && (
                <p className="evolution-message" role="status">
                  Ainda não há registros de execução disponíveis para demonstrar a evolução deste aluno.
                </p>
              )}

              {showNoFilteredResults && (
                <p className="evolution-message" role="status">
                  Nenhum registro corresponde aos filtros selecionados.
                </p>
              )}

              {showEvolutionResults && (
                <div className="evolution-groups">
                  {visibleEvolution.map((group) => (
                    <EvolutionGroup
                      key={`${group.activityId}-${group.metric}`}
                      group={group}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default StudentEvolution
