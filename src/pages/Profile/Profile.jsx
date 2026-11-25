import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Save, X } from 'lucide-react'
import StudentBottomNav from '../../components/StudentBottomNav.jsx'
import StudentButton from '../../components/StudentButton.jsx'
import BrandLogo from '../../components/BrandLogo.jsx'
import SmoothTab from '../../components/kokonutui/smooth-tab.jsx'
import { getApiErrorMessage, getStoredUser, logoutUser } from '../../services/authService.js'
import { getStudentSessions } from '../../services/sessionService.js'
import { getStudentBodyMetrics, saveStudentBodyMetrics } from '../../services/studentBodyMetricsService.js'
import '../Sessions/StartSession.css'
import '../Home/Home.css'
import './Profile.css'

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
const WEEK_RANGE_FORMATTER = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })

function getDateKey(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getWeekDays(today, weekOffset = 0) {
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) + weekOffset * 7)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return date
  })
}

function formatWeekRange(weekDays) {
  const firstDay = weekDays[0]
  const lastDay = weekDays[6]
  const sameMonth = firstDay.getMonth() === lastDay.getMonth() && firstDay.getFullYear() === lastDay.getFullYear()
  const first = WEEK_RANGE_FORMATTER.format(firstDay).replace(' de ', ' ')
  const last = sameMonth ? String(lastDay.getDate()) : WEEK_RANGE_FORMATTER.format(lastDay).replace(' de ', ' ')
  const year = firstDay.getFullYear() === lastDay.getFullYear() ? lastDay.getFullYear() : `${firstDay.getFullYear()}–${lastDay.getFullYear()}`
  return `${first} – ${last} · ${year}`
}

function ChevronIcon({ direction }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={direction === 'previous' ? 'm14.5 5-7 7 7 7' : 'm9.5 5 7 7-7 7'} />
    </svg>
  )
}

function getSessionDuration(session) {
  if (!session.startedAt || !session.finishedAt) return null
  const startedAt = new Date(session.startedAt).getTime()
  const finishedAt = new Date(session.finishedAt).getTime()
  if (!Number.isFinite(startedAt) || !Number.isFinite(finishedAt) || finishedAt < startedAt) return null
  return finishedAt - startedAt
}

function formatDuration(milliseconds) {
  if (milliseconds == null) return '—'
  const totalMinutes = Math.round(milliseconds / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours ? `${hours}h ${String(minutes).padStart(2, '0')}m` : `${totalMinutes} min`
}

function ExitIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" />
      <path d="M10 17l5-5-5-5m5 5H3" />
    </svg>
  )
}

function CircularMetric({ value, label, progress = 1, showProgress = true, variant = '' }) {
  const circumference = 2 * Math.PI * 36
  const normalizedProgress = Math.max(0, Math.min(1, progress))

  return (
    <div className={`profile-ring ${variant}`} role="img" aria-label={`${label}: ${value}`}>
      <svg viewBox="0 0 88 88" aria-hidden="true">
        <circle className="profile-ring-track" cx="44" cy="44" r="36" />
        <circle
          className="profile-ring-value"
          cx="44"
          cy="44"
          r="36"
          style={{ strokeDasharray: circumference, strokeDashoffset: circumference * (1 - normalizedProgress), opacity: showProgress ? 1 : 0 }}
        />
      </svg>
      <span className="profile-ring-center">{value}</span>
    </div>
  )
}

const WEIGHT_CHART_PERIODS = [
  { id: 'week', label: 'Semana', days: 7 },
  { id: 'month', label: 'Mês', days: 30 },
  { id: 'year', label: 'Ano', days: 365 },
]

function WeightTrendChart({ records }) {
  const [periodId, setPeriodId] = useState('month')
  const period = WEIGHT_CHART_PERIODS.find((item) => item.id === periodId) ?? WEIGHT_CHART_PERIODS[1]
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - period.days)
  const points = records
    .map((record) => ({ ...record, date: new Date(record.recordedAt) }))
    .filter((record) => !Number.isNaN(record.date.getTime()) && record.date >= start && record.date <= end)
  const chart = { width: 360, height: 210, left: 22, right: 326, top: 19, bottom: 150 }
  const weights = points.map((point) => point.weightKg)
  const minimum = weights.length ? Math.min(...weights) : 0
  const maximum = weights.length ? Math.max(...weights) : 1
  const padding = Math.max((maximum - minimum) * 0.2, maximum * 0.025, 0.5)
  const minScale = Math.max(0, minimum - padding)
  const maxScale = maximum + padding
  const x = (index) => points.length < 2
    ? chart.left + (chart.right - chart.left) / 2
    : chart.left + (index / (points.length - 1)) * (chart.right - chart.left)
  const y = (weight) => chart.bottom - ((weight - minScale) / (maxScale - minScale || 1)) * (chart.bottom - chart.top)
  const line = points.map((point, index) => (index ? 'L ' : 'M ') + x(index) + ' ' + y(point.weightKg)).join(' ')
  const ticks = Array.from({ length: 4 }, (_, index) => maxScale - ((maxScale - minScale) / 3) * index)
  const dateLabelIndices = points.length <= 5
    ? points.map((_, index) => index)
    : [...new Set([0, Math.round((points.length - 1) / 3), Math.round((points.length - 1) * 2 / 3), points.length - 1])]
  const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
  const weightFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

  return (
    <div className="profile-weight-chart">
      <div className="profile-weight-chart-heading">
        <h3>Peso</h3>
        <span>{points.length ? weightFormatter.format(points.at(-1).weightKg) + ' kg' : 'Histórico'}</span>
      </div>
      <div className="profile-weight-periods" role="tablist" aria-label="Período do gráfico de peso">
        {WEIGHT_CHART_PERIODS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={periodId === item.id}
            className={periodId === item.id ? 'is-active' : ''}
            onClick={() => setPeriodId(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {points.length ? (
        <svg
          className="profile-weight-chart-svg"
          viewBox={'0 0 ' + chart.width + ' ' + chart.height}
          role="img"
          aria-label={'Histórico de peso nas últimas ' + period.days + ' dias'}
        >
          {ticks.map((tick, index) => {
            const tickY = chart.top + ((chart.bottom - chart.top) / 3) * index
            return (
              <g key={index}>
                <line x1={chart.left} x2={chart.right} y1={tickY} y2={tickY} className={index === 1 ? 'is-reference' : ''} />
                <text x="354" y={tickY + 3} textAnchor="end">{weightFormatter.format(tick)}</text>
              </g>
            )
          })}
          {dateLabelIndices.map((index) => (
            <g key={(points[index].id ?? points[index].date.toISOString()) + '-' + index}>
              <line x1={x(index)} x2={x(index)} y1={chart.top} y2={chart.bottom} className="profile-weight-chart-guide" />
              <text x={x(index)} y="174" textAnchor="middle">{dateFormatter.format(points[index].date)}</text>
            </g>
          ))}
          <path d={line} className="profile-weight-chart-line" />
          {points.map((point, index) => (
            <circle
              key={(point.id ?? point.date.toISOString()) + '-' + index}
              cx={x(index)}
              cy={y(point.weightKg)}
              r="3.4"
              className="profile-weight-chart-point"
            >
              <title>{dateFormatter.format(point.date) + ': ' + weightFormatter.format(point.weightKg) + ' kg'}</title>
            </circle>
          ))}
        </svg>
      ) : (
        <p className="profile-weight-chart-empty">Não há pesagens neste período.</p>
      )}
    </div>
  )
}

function ProfilePage() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [sessions, setSessions] = useState([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [sessionsMessage, setSessionsMessage] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [bodyMetrics, setBodyMetrics] = useState(null)
  const [bodyMetricsLoading, setBodyMetricsLoading] = useState(true)
  const [bodyMetricsSaving, setBodyMetricsSaving] = useState(false)
  const [bodyMetricsError, setBodyMetricsError] = useState('')
  const [bodyMetricsFeedback, setBodyMetricsFeedback] = useState('')
  const [isBodyMetricsEditorOpen, setIsBodyMetricsEditorOpen] = useState(false)
  const [bodyMetricsTab, setBodyMetricsTab] = useState('evolucao')
  const [weightInput, setWeightInput] = useState('')
  const [heightInput, setHeightInput] = useState('')
  const [weekOffset, setWeekOffset] = useState(0)
  const swipeStartX = useRef(null)

  useEffect(() => {
    if (!isBodyMetricsEditorOpen) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !bodyMetricsSaving) setIsBodyMetricsEditorOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isBodyMetricsEditorOpen, bodyMetricsSaving])

  useEffect(() => {
    let isCurrent = true

    async function loadSessions() {
      try {
        const history = await getStudentSessions()
        if (isCurrent) {
          setSessions(history.filter((session) => session.status === 'COMPLETED'))
          setSessionsMessage('')
        }
      } catch (error) {
        if (isCurrent) {
          setSessions([])
          setSessionsMessage(getApiErrorMessage(error, 'Não foi possível carregar seu histórico de sessões.'))
        }
      } finally {
        if (isCurrent) setIsLoadingSessions(false)
      }
    }

    loadSessions()
    return () => { isCurrent = false }
  }, [loadAttempt])

  useEffect(() => {
    if (user?.profile !== 'STUDENT') {
      return undefined
    }
    const controller = new AbortController()
    getStudentBodyMetrics(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setBodyMetrics(data)
        setWeightInput(data?.weightKg == null ? '' : String(data.weightKg))
        setHeightInput(data?.heightCm == null ? '' : String(data.heightCm))
        setBodyMetricsError('')
      })
      .catch((error) => {
        if (!controller.signal.aborted) setBodyMetricsError(error.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setBodyMetricsLoading(false)
      })
    return () => controller.abort()
  }, [user?.profile])

  async function handleBodyMetricsSubmit(event) {
    event.preventDefault()
    setBodyMetricsSaving(true)
    setBodyMetricsError('')
    setBodyMetricsFeedback('')
    try {
      const saved = await saveStudentBodyMetrics({ weightKg: Number(weightInput), heightCm: Number(heightInput) })
      setBodyMetrics(saved)
      setBodyMetricsFeedback('Medidas salvas com sucesso.')
      setIsBodyMetricsEditorOpen(false)
    } catch (error) {
      setBodyMetricsError(error.message)
    } finally {
      setBodyMetricsSaving(false)
    }
  }

  function openBodyMetricsEditor() {
    setWeightInput(bodyMetrics?.weightKg == null ? '' : String(bodyMetrics.weightKg))
    setHeightInput(bodyMetrics?.heightCm == null ? '' : String(bodyMetrics.heightCm))
    setBodyMetricsError('')
    setIsBodyMetricsEditorOpen(true)
  }

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

  const today = new Date()
  const todayKey = getDateKey(today)
  const weekDays = getWeekDays(today, weekOffset)
  const completedByDay = new Map()
  sessions.forEach((session) => {
    const key = getDateKey(session.finishedAt)
    if (key) completedByDay.set(key, (completedByDay.get(key) || 0) + 1)
  })

  const sessionsWithDuration = sessions
    .map((session) => ({ session, duration: getSessionDuration(session) }))
    .filter((item) => item.duration != null)
  const shortestSession = sessionsWithDuration.reduce(
    (shortest, item) => !shortest || item.duration < shortest.duration ? item : shortest,
    null,
  )
  const longestSession = sessionsWithDuration.reduce(
    (longest, item) => !longest || item.duration > longest.duration ? item : longest,
    null,
  )
  const longestDuration = longestSession?.duration || 0
  const shortestProgress = longestDuration ? shortestSession.duration / longestDuration : 0
  const photoUrl = user?.photoUrl || user?.avatarUrl || user?.imageUrl || user?.picture
  const initials = user?.name?.trim()?.charAt(0)?.toLocaleUpperCase('pt-BR') || '•'

  function handleWeekPointerDown(event) {
    swipeStartX.current = event.clientX
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function handleWeekPointerUp(event) {
    if (swipeStartX.current == null) return
    const distance = event.clientX - swipeStartX.current
    swipeStartX.current = null

    if (Math.abs(distance) < 40) return
    setWeekOffset((offset) => offset + (distance < 0 ? 1 : -1))
  }

  return (
    <main className="start-session-page profile-page">
      <header className="session-header profile-header">
        <div className="session-brand"><BrandLogo className="session-brand-logo" to="/home" /></div>
        <StudentButton
          variant="icon"
          type="button"
          className="profile-logout-icon"
          onClick={handleLogout}
          disabled={isLoggingOut}
          aria-label={isLoggingOut ? 'Saindo da conta' : 'Sair da conta'}
          title="Sair da conta"
        >
          <ExitIcon />
        </StudentButton>
      </header>

      <section className="profile-dashboard-content">

        <section className="profile-identity" aria-label="Perfil do aluno">
          <div className="profile-avatar" aria-hidden="true">
            <span>{initials}</span>
            {photoUrl && <img src={photoUrl} alt="" onError={(event) => { event.currentTarget.hidden = true }} />}
          </div>
          <div className="profile-identity-copy">
            <p className="profile-eyebrow">SUA CONTA</p>
            <h1>{user?.name || 'Aluno'}</h1>
            <p>{user?.email || 'E-mail não informado'}</p>
          </div>
        </section>

        <section className="profile-week-section" aria-labelledby="profile-week-title">
          <div className="profile-section-heading">
            <div>
              <p className="profile-eyebrow">ROTINA</p>
              <h2 id="profile-week-title">Sua semana</h2>
            </div>
            <div className="profile-week-navigation" aria-label="Navegar entre semanas">
              <StudentButton variant="icon" onClick={() => setWeekOffset((offset) => offset - 1)} aria-label="Ver semana anterior">
                <ChevronIcon direction="previous" />
              </StudentButton>
              <span className="profile-month-label" aria-live="polite">{formatWeekRange(weekDays)}</span>
              <StudentButton variant="icon" onClick={() => setWeekOffset((offset) => offset + 1)} aria-label="Ver próxima semana">
                <ChevronIcon direction="next" />
              </StudentButton>
            </div>
          </div>

          <div
            className="profile-week-calendar"
            id="profile-week-calendar"
            role="list"
            aria-label={`Sessões concluídas na semana ${formatWeekRange(weekDays)}`}
            onPointerDown={handleWeekPointerDown}
            onPointerUp={handleWeekPointerUp}
            onPointerCancel={() => { swipeStartX.current = null }}
          >
            {weekDays.map((date) => {
              const key = getDateKey(date)
              const completedCount = completedByDay.get(key) || 0
              const isToday = key === todayKey
              const weekday = WEEKDAY_FORMATTER.format(date).replace('.', '')
              return (
                <div
                  className={`profile-week-day${isToday ? ' is-today' : ''}${completedCount ? ' has-session' : ''}`}
                  key={key}
                  role="listitem"
                  aria-label={`${weekday}, ${date.getDate()}${completedCount ? `: ${completedCount} ${completedCount === 1 ? 'sessão concluída' : 'sessões concluídas'}` : ''}${isToday ? ', hoje' : ''}`}
                >
                  <span className="profile-weekday" aria-hidden="true">{weekday}</span>
                  <span className="profile-day-number" aria-hidden="true">{date.getDate()}</span>
                  <span className="profile-day-marker" aria-hidden="true">
                    {completedCount > 1 ? completedCount : completedCount === 1 ? '✓' : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </section>


        {user?.profile === 'STUDENT' && <section className="profile-body-metrics profile-week-section" aria-labelledby="profile-body-metrics-title">
          <div className="profile-section-heading">
            <div>
              <p className="profile-eyebrow">ACOMPANHAMENTO</p>
              <h2 id="profile-body-metrics-title">Peso, altura e IMC</h2>
            </div>
          </div>
          {bodyMetricsLoading ? <p className="profile-stat-loading" role="status">Carregando suas medidas...</p> : bodyMetricsError && !bodyMetrics ? <p className="profile-body-metrics-message is-error" role="alert">{bodyMetricsError}</p> : bodyMetrics && (
            <SmoothTab
              value={bodyMetricsTab}
              onChange={setBodyMetricsTab}
              activeColor="profile-body-metrics-active"
              activeTextColor="text-white"
              label="Acompanhamento de medidas"
              className="profile-body-metrics-tabs w-full max-w-none"
              items={[
                {
                  id: 'evolucao',
                  title: 'Evolução do peso',
                  content: <WeightTrendChart records={bodyMetrics.history ?? []} />,
                },
                {
                  id: 'medidas',
                  title: 'Medidas e IMC',
                  content: (
                    <div className="profile-body-metrics-summary">
                      <div className="profile-body-metrics-table-heading">
                        <span>Medidas registradas</span>
                        <button
                          className="profile-body-metrics-edit"
                          type="button"
                          onClick={openBodyMetricsEditor}
                          aria-label="Editar peso e altura"
                          title="Editar peso e altura"
                        >
                          <Pencil size={17} strokeWidth={2} aria-hidden="true" />
                        </button>
                      </div>
                      <table className="profile-body-metrics-table">
                        <tbody>
                          <tr><th scope="row">Peso atual</th><td>{bodyMetrics.weightKg.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg</td></tr>
                          <tr><th scope="row">Altura</th><td>{bodyMetrics.heightCm.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} cm</td></tr>
                          <tr><th scope="row">IMC</th><td><strong>{bodyMetrics.bmi.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> kg/m²</td></tr>
                        </tbody>
                      </table>
                      <small>Atualizado em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(bodyMetrics.updatedAt))}</small>
                    </div>
                  ),
                },
              ]}
            />
          )}
          {!bodyMetricsLoading && !bodyMetricsError && !bodyMetrics && (
            <div className="profile-body-metrics-empty">
              <p>Registre seu peso e sua altura para acompanhar o IMC.</p>
              <button className="profile-body-metrics-edit" type="button" onClick={openBodyMetricsEditor} aria-label="Adicionar peso e altura" title="Adicionar peso e altura">
                <Pencil size={17} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
          )}
          {bodyMetricsFeedback && <p className="profile-body-metrics-message is-success" role="status">{bodyMetricsFeedback}</p>}
          {isBodyMetricsEditorOpen && (
            <div
              className="profile-body-metrics-modal-backdrop"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget && !bodyMetricsSaving) setIsBodyMetricsEditorOpen(false)
              }}
            >
              <section className="profile-body-metrics-modal" role="dialog" aria-modal="true" aria-labelledby="profile-body-metrics-modal-title">
                <header className="profile-body-metrics-modal-heading">
                  <div>
                    <p className="profile-eyebrow">ACOMPANHAMENTO</p>
                    <h3 id="profile-body-metrics-modal-title">{bodyMetrics ? 'Editar medidas' : 'Registrar medidas'}</h3>
                  </div>
                  <button className="profile-body-metrics-modal-close" type="button" onClick={() => setIsBodyMetricsEditorOpen(false)} disabled={bodyMetricsSaving} aria-label="Fechar edição">
                    <X size={19} aria-hidden="true" />
                  </button>
                </header>
                <form className="profile-body-metrics-form" onSubmit={handleBodyMetricsSubmit} aria-busy={bodyMetricsSaving}>
                  <label htmlFor="profile-weight">Peso (kg)
                    <input id="profile-weight" name="weightKg" type="number" min="1" max="500" step="0.1" required value={weightInput} onChange={(event) => setWeightInput(event.target.value)} disabled={bodyMetricsSaving} autoFocus />
                  </label>
                  <label htmlFor="profile-height">Altura (cm)
                    <input id="profile-height" name="heightCm" type="number" min="30" max="260" step="0.1" required value={heightInput} onChange={(event) => setHeightInput(event.target.value)} disabled={bodyMetricsSaving} />
                  </label>
                  <button
                    className="profile-body-metrics-save"
                    type="submit"
                    disabled={bodyMetricsSaving || !weightInput || !heightInput}
                    aria-label={bodyMetricsSaving ? 'Salvando medidas' : 'Salvar medidas'}
                    title={bodyMetricsSaving ? 'Salvando medidas' : 'Salvar medidas'}
                  >
                    <Save size={19} strokeWidth={2} aria-hidden="true" />
                  </button>
                </form>
                {bodyMetricsError && <p className="profile-body-metrics-message is-error" role="alert">{bodyMetricsError}</p>}
              </section>
            </div>
          )}
        </section>}

        {sessionsMessage ? (
          <div className="profile-history-message" role="alert">
            <p>{sessionsMessage}</p>
            <StudentButton variant="secondary" onClick={() => { setSessionsMessage(''); setIsLoadingSessions(true); setLoadAttempt((attempt) => attempt + 1) }}>
              Tentar novamente
            </StudentButton>
          </div>
        ) : (
        <section className="profile-stats-grid" aria-label="Resumo das sessões">
          <article className="profile-stat-card profile-count-card">
            <div className="profile-section-heading">
              <div>
                <p className="profile-eyebrow">HISTÓRICO</p>
                <h2>Sessões concluídas</h2>
              </div>
            </div>
            {isLoadingSessions ? (
              <p className="profile-stat-loading" role="status">Carregando dados...</p>
            ) : (
              <div className="profile-count-content">
                <CircularMetric
                  value={sessions.length}
                  label={`${sessions.length} ${sessions.length === 1 ? 'sessão concluída' : 'sessões concluídas'}`}
                  showProgress={false}
                  variant="profile-ring-count"
                />
                <p>{sessions.length === 1 ? 'sessão registrada' : 'sessões registradas'}</p>
              </div>
            )}
          </article>

          <article className="profile-stat-card profile-duration-card">
            <div className="profile-section-heading">
              <div>
                <p className="profile-eyebrow">DURAÇÃO</p>
                <h2>Seus extremos</h2>
              </div>
            </div>
            {isLoadingSessions ? (
              <p className="profile-stat-loading" role="status">Carregando dados...</p>
            ) : sessionsWithDuration.length ? (
              <div className="profile-duration-content">
                <div className="profile-duration-metric">
                  <CircularMetric
                    value={formatDuration(longestSession.duration)}
                    label={`Sessão mais longa: ${formatDuration(longestSession.duration)}`}
                    progress={1}
                    variant="profile-ring-longest"
                  />
                  <h3>Mais longa</h3>
                  <p>Do início ao término</p>
                </div>
                <div className="profile-duration-metric">
                  <CircularMetric
                    value={formatDuration(shortestSession.duration)}
                    label={`Sessão mais curta: ${formatDuration(shortestSession.duration)}`}
                    progress={shortestProgress}
                    variant="profile-ring-shortest"
                  />
                  <h3>Mais curta</h3>
                  <p>Do início ao término</p>
                </div>
              </div>
            ) : (
              <p className="profile-stat-empty">Ainda não há horários de início e término suficientes para calcular a duração.</p>
            )}
          </article>
        </section>
        )}
      </section>

      <StudentBottomNav active="profile" showAccountMenu={false} />
    </main>
  )
}

export default ProfilePage
