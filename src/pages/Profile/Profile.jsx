import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StudentBottomNav from '../../components/StudentBottomNav.jsx'
import BrandLogo from '../../components/BrandLogo.jsx'
import { getApiErrorMessage, getStoredUser, logoutUser } from '../../services/authService.js'
import { getStudentSessions } from '../../services/sessionService.js'
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

function CircularMetric({ value, label, progress = 1, variant = '' }) {
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
          style={{ strokeDasharray: circumference, strokeDashoffset: circumference * (1 - normalizedProgress) }}
        />
      </svg>
      <span className="profile-ring-center">{value}</span>
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
  const [weekOffset, setWeekOffset] = useState(0)
  const swipeStartX = useRef(null)

  useEffect(() => {
    let isCurrent = true

    async function loadSessions() {
      try {
        const history = await getStudentSessions()
        if (isCurrent) setSessions(history.filter((session) => session.status === 'COMPLETED'))
      } catch (error) {
        if (isCurrent) {
          setSessionsMessage(getApiErrorMessage(error, 'Não foi possível carregar seu histórico de sessões.'))
        }
      } finally {
        if (isCurrent) setIsLoadingSessions(false)
      }
    }

    loadSessions()
    return () => { isCurrent = false }
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
        <div className="session-brand"><BrandLogo className="session-brand-logo" /></div>
        <button
          type="button"
          className="profile-logout-icon"
          onClick={handleLogout}
          disabled={isLoggingOut}
          aria-label={isLoggingOut ? 'Saindo da conta' : 'Sair da conta'}
          title="Sair da conta"
        >
          <ExitIcon />
        </button>
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
              <button type="button" onClick={() => setWeekOffset((offset) => offset - 1)} aria-label="Ver semana anterior">
                <ChevronIcon direction="previous" />
              </button>
              <span className="profile-month-label" aria-live="polite">{formatWeekRange(weekDays)}</span>
              <button type="button" onClick={() => setWeekOffset((offset) => offset + 1)} aria-label="Ver próxima semana">
                <ChevronIcon direction="next" />
              </button>
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
          {isLoadingSessions ? (
            <p className="profile-calendar-note" role="status">Carregando sessões...</p>
          ) : (
            <p className="profile-calendar-note">Deslize para ver outras semanas. Os dias marcados têm sessões concluídas.</p>
          )}
        </section>

        {sessionsMessage && <p className="profile-history-message" role="alert">{sessionsMessage}</p>}

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
      </section>

      <StudentBottomNav active="profile" />
    </main>
  )
}

export default ProfilePage
