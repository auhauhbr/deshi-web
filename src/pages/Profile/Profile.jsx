import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { ArrowLeft, CalendarDays, Check, ChevronLeft, ChevronRight, LockKeyhole, Pencil, Save, UserRound, VenusAndMars, X } from 'lucide-react'
import StudentBottomNav from '../../components/StudentBottomNav.jsx'
import StudentButton from '../../components/StudentButton.jsx'
import StudentHeader from '../../components/StudentHeader.jsx'
import SmoothTab from '../../components/kokonutui/smooth-tab.jsx'
import WeightTrendChart from '../../components/WeightTrendChart.jsx'
import { getApiErrorMessage, getStoredUser, logoutUser } from '../../services/authService.js'
import { changeStudentPassword, updateStudentProfile } from '../../services/studentProfileService.js'
import { getLocalDateInputValue } from '../../utils/date.js'
import { formatBirthDate, getAgeInfo } from '../../utils/userAge.js'
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

function toDateInputValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getCalendarDays(monthDate) {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7
  const start = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), 1 - mondayOffset)
  return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index))
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

function ProfilePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(() => getStoredUser())
  const ageInfo = getAgeInfo(user?.birthDate)
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
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false)
  const [profileEditSection, setProfileEditSection] = useState('menu')
  const [profileEditName, setProfileEditName] = useState('')
  const [profileEditBirthDate, setProfileEditBirthDate] = useState('')
  const [profileEditGender, setProfileEditGender] = useState('')
  const [profileEditPassword, setProfileEditPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [profileEditError, setProfileEditError] = useState('')
  const [profileEditFeedback, setProfileEditFeedback] = useState('')
  const [profileEditSaving, setProfileEditSaving] = useState(false)
  const [birthDateCalendarMonth, setBirthDateCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
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
    if (!isProfileEditorOpen) return undefined
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !profileEditSaving) setIsProfileEditorOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isProfileEditorOpen, profileEditSaving])

  useEffect(() => {
    if (!location.state?.openEditProfile) return
    openProfileEditor()
    navigate(location.pathname, { replace: true, state: null })
  }, [location.key, location.pathname, location.state, navigate])

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

  function openProfileEditor() {
    setProfileEditName(user?.name ?? '')
    setProfileEditBirthDate(user?.birthDate ?? '')
    setProfileEditGender(user?.gender ?? '')
    setProfileEditPassword({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setProfileEditSection('menu')
    setProfileEditError('')
    setProfileEditFeedback('')
    setIsProfileEditorOpen(true)
  }

  function selectProfileEditSection(section) {
    setProfileEditSection(section)
    setProfileEditError('')
    if (section === 'birthDate') {
      const value = user?.birthDate || getLocalDateInputValue()
      const selected = new Date(`${value}T12:00:00`)
      setBirthDateCalendarMonth(new Date(selected.getFullYear(), selected.getMonth(), 1))
    }
  }

  async function handleProfileEditSubmit(event) {
    event.preventDefault()
    setProfileEditError('')
    if (profileEditSection === 'name' && profileEditName.trim().length < 3) {
      setProfileEditError('O nome deve ter pelo menos 3 caracteres.')
      return
    }
    if (profileEditSection === 'password') {
      if (!profileEditPassword.currentPassword || profileEditPassword.newPassword.length < 8) {
        setProfileEditError('Informe sua senha atual e uma nova senha com pelo menos 8 caracteres.')
        return
      }
      if (profileEditPassword.newPassword !== profileEditPassword.confirmPassword) {
        setProfileEditError('A nova senha e a confirmação não coincidem.')
        return
      }
    }
    if (profileEditSection === 'birthDate' && (!profileEditBirthDate || profileEditBirthDate > getLocalDateInputValue())) {
      setProfileEditError('Selecione uma data de nascimento válida.')
      return
    }
    if (profileEditSection === 'gender' && !profileEditGender) {
      setProfileEditError('Selecione o gênero para continuar.')
      return
    }

    setProfileEditSaving(true)
    try {
      if (profileEditSection === 'name') {
        setUser(await updateStudentProfile({ name: profileEditName.trim() }))
        setProfileEditFeedback('Nome atualizado com sucesso.')
      } else if (profileEditSection === 'birthDate') {
        setUser(await updateStudentProfile({ birthDate: profileEditBirthDate }))
        setProfileEditFeedback('Data de nascimento cadastrada com sucesso.')
      } else if (profileEditSection === 'gender') {
        setUser(await updateStudentProfile({ gender: profileEditGender }))
        setProfileEditFeedback('Gênero cadastrado com sucesso.')
      } else if (profileEditSection === 'password') {
        await changeStudentPassword(profileEditPassword)
        setProfileEditFeedback('Senha alterada com sucesso.')
      }
      setIsProfileEditorOpen(false)
    } catch (error) {
      setProfileEditError(getApiErrorMessage(error, 'Não foi possível salvar as alterações. Tente novamente.'))
    } finally {
      setProfileEditSaving(false)
    }
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
  const birthDateCalendarDays = getCalendarDays(birthDateCalendarMonth)
  const birthDateMonthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(birthDateCalendarMonth)
  const todayDateValue = getLocalDateInputValue()

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
      <StudentHeader className="profile-header" onEditProfile={openProfileEditor} />

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
            {(user?.birthDate || user?.gender) && <p className="profile-birth-date">{[user?.birthDate && `Nascimento: ${formatBirthDate(user.birthDate)}`, ageInfo && `${ageInfo.category} (${ageInfo.age} anos)`, user?.gender && (user.gender === 'MALE' ? 'Masculino' : 'Feminino')].filter(Boolean).join(' · ')}</p>}
          </div>
        </section>
        {profileEditFeedback && <p className="profile-body-metrics-message is-success" role="status">{profileEditFeedback}</p>}

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
          {bodyMetricsLoading ? <p className="profile-stat-loading" role="status">Carregando suas medidas...</p> : bodyMetricsError && !bodyMetrics ? <p className="profile-body-metrics-message is-error" role="alert">{bodyMetricsError}</p> : !bodyMetrics ? (
            <div className="profile-body-metrics-empty">
              <p>Você ainda não registrou peso e altura.</p>
              <button className="profile-body-metrics-edit" type="button" onClick={openBodyMetricsEditor}>
                <Pencil size={16} aria-hidden="true" /> Registrar medidas
              </button>
            </div>
          ) : (
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
                  content: <WeightTrendChart records={bodyMetrics.history ?? []} heightCm={bodyMetrics.heightCm} birthDate={user?.birthDate} gender={user?.gender} />,
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
                          aria-label={bodyMetrics ? 'Editar peso e altura' : 'Cadastrar peso e altura'}
                          title={bodyMetrics ? 'Editar peso e altura' : 'Cadastrar peso e altura'}
                        >
                          <Pencil size={17} strokeWidth={2} aria-hidden="true" />
                        </button>
                      </div>
                      <table className="profile-body-metrics-table">
                        <tbody>
                          <tr><th scope="row">Peso atual</th><td>{(bodyMetrics?.weightKg ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg</td></tr>
                          <tr><th scope="row">Altura</th><td>{(bodyMetrics?.heightCm ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} cm</td></tr>
                          <tr><th scope="row">IMC</th><td><strong>{(bodyMetrics?.bmi ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> kg/m²</td></tr>
                          {ageInfo && <tr><th scope="row">Faixa etária</th><td>{ageInfo.category} · {ageInfo.age} anos</td></tr>}
                        </tbody>
                      </table>
                      {ageInfo?.age < 20 && <p className="profile-body-metrics-help">Em crianças e adolescentes, a interpretação do IMC considera idade e sexo. O valor exibido é o cálculo do IMC, sem classificação clínica.</p>}
                      {bodyMetrics?.updatedAt
                        ? <small>Atualizado em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(bodyMetrics.updatedAt))}</small>
                        : <small>Medidas ainda não cadastradas.</small>}
                    </div>
                  ),
                },
              ]}
            />
          )}
          {bodyMetricsFeedback && <p className="profile-body-metrics-message is-success" role="status">{bodyMetricsFeedback}</p>}
          {isBodyMetricsEditorOpen && createPortal((
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
          ), document.body)}
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

      {isProfileEditorOpen && createPortal((
        <div className="profile-edit-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !profileEditSaving) setIsProfileEditorOpen(false) }}>
          <section className="profile-edit-modal" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title">
            <header className="profile-edit-modal__header">
              <div className="profile-edit-modal__title-wrap">
                {profileEditSection !== 'menu' && <button className="profile-edit-back" type="button" onClick={() => selectProfileEditSection('menu')} disabled={profileEditSaving} aria-label="Voltar às opções"><ArrowLeft size={18} /></button>}
                <div><p className="profile-eyebrow">SUA CONTA</p><h2 id="profile-edit-title">{profileEditSection === 'menu' ? 'Editar perfil' : profileEditSection === 'name' ? 'Alterar nome' : profileEditSection === 'password' ? 'Alterar senha' : profileEditSection === 'birthDate' ? 'Data de nascimento' : 'Cadastrar gênero'}</h2></div>
              </div>
              <button className="profile-body-metrics-modal-close" type="button" onClick={() => setIsProfileEditorOpen(false)} disabled={profileEditSaving} aria-label="Fechar edição do perfil"><X size={19} /></button>
            </header>

            {profileEditSection === 'menu' ? <div className="profile-edit-options">
              <button type="button" onClick={() => selectProfileEditSection('name')}><span className="profile-edit-option-icon"><UserRound size={18} /></span><span><strong>Nome</strong><small>Atualize como seu nome aparece no perfil</small></span><ChevronRight size={18} /></button>
              <button type="button" onClick={() => selectProfileEditSection('password')}><span className="profile-edit-option-icon"><LockKeyhole size={18} /></span><span><strong>Senha</strong><small>Altere sua senha de acesso</small></span><ChevronRight size={18} /></button>
              {!user?.birthDate && <button type="button" onClick={() => selectProfileEditSection('birthDate')}><span className="profile-edit-option-icon"><CalendarDays size={18} /></span><span><strong>Data de nascimento</strong><small>Adicione sua data para completar o perfil</small></span><ChevronRight size={18} /></button>}
              {!user?.gender && <button type="button" onClick={() => selectProfileEditSection('gender')}><span className="profile-edit-option-icon"><VenusAndMars size={18} /></span><span><strong>Gênero</strong><small>Adicione essa informação ao perfil</small></span><ChevronRight size={18} /></button>}
            </div> : null}

            {profileEditSection === 'name' && <form className="profile-edit-form" onSubmit={handleProfileEditSubmit}>
              <label htmlFor="profile-edit-name">Nome completo<input id="profile-edit-name" name="name" type="text" autoComplete="name" minLength="3" required value={profileEditName} onChange={(event) => setProfileEditName(event.target.value)} disabled={profileEditSaving} autoFocus /></label>
              {profileEditError && <p className="profile-body-metrics-message is-error" role="alert">{profileEditError}</p>}
              <button className="profile-edit-submit" type="submit" disabled={profileEditSaving || profileEditName.trim().length < 3}><Save size={17} />{profileEditSaving ? 'Salvando...' : 'Salvar nome'}</button>
            </form>}

            {profileEditSection === 'password' && <form className="profile-edit-form" onSubmit={handleProfileEditSubmit}>
              <label htmlFor="profile-current-password">Senha atual<input id="profile-current-password" name="currentPassword" type="password" autoComplete="current-password" minLength="8" required value={profileEditPassword.currentPassword} onChange={(event) => setProfileEditPassword((current) => ({ ...current, currentPassword: event.target.value }))} disabled={profileEditSaving} autoFocus /></label>
              <label htmlFor="profile-new-password">Nova senha<input id="profile-new-password" name="newPassword" type="password" autoComplete="new-password" minLength="8" required value={profileEditPassword.newPassword} onChange={(event) => setProfileEditPassword((current) => ({ ...current, newPassword: event.target.value }))} disabled={profileEditSaving} /></label>
              <label htmlFor="profile-confirm-password">Digite novamente a nova senha<input id="profile-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength="8" required value={profileEditPassword.confirmPassword} onChange={(event) => setProfileEditPassword((current) => ({ ...current, confirmPassword: event.target.value }))} disabled={profileEditSaving} /></label>
              {profileEditError && <p className="profile-body-metrics-message is-error" role="alert">{profileEditError}</p>}
              <button className="profile-edit-submit" type="submit" disabled={profileEditSaving || !profileEditPassword.currentPassword || profileEditPassword.newPassword.length < 8 || !profileEditPassword.confirmPassword}><Save size={17} />{profileEditSaving ? 'Salvando...' : 'Alterar senha'}</button>
            </form>}

            {profileEditSection === 'birthDate' && <form className="profile-edit-form" onSubmit={handleProfileEditSubmit}>
              <div className="profile-edit-calendar">
                <div className="profile-edit-calendar__navigation"><button type="button" onClick={() => setBirthDateCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Mês anterior"><ChevronLeft size={18} /></button><strong>{birthDateMonthLabel}</strong><label>Ano<input type="number" min="1900" max={new Date().getFullYear()} value={birthDateCalendarMonth.getFullYear()} aria-label="Ano de nascimento" onChange={(event) => { const year = Number(event.target.value); if (year >= 1900 && year <= new Date().getFullYear()) setBirthDateCalendarMonth((month) => new Date(year, month.getMonth(), 1)) }} /></label><button type="button" onClick={() => setBirthDateCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))} disabled={toDateInputValue(new Date(birthDateCalendarMonth.getFullYear(), birthDateCalendarMonth.getMonth() + 1, 1)) > todayDateValue} aria-label="Próximo mês"><ChevronRight size={18} /></button></div>
                <div className="profile-edit-calendar__weekdays" aria-hidden="true">{['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => <span key={day}>{day}</span>)}</div>
                <div className="profile-edit-calendar__grid">{birthDateCalendarDays.map((date) => { const dateValue = toDateInputValue(date); return <button className={`${date.getMonth() === birthDateCalendarMonth.getMonth() ? '' : 'is-outside-month'} ${profileEditBirthDate === dateValue ? 'is-selected' : ''}`} type="button" key={dateValue} disabled={dateValue > todayDateValue} aria-pressed={profileEditBirthDate === dateValue} aria-label={new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(date)} onClick={() => setProfileEditBirthDate(dateValue)}>{date.getDate()}</button> })}</div>
              </div>
              {profileEditBirthDate && <p className="profile-edit-selected-date">Data selecionada: {formatBirthDate(profileEditBirthDate)}</p>}
              {profileEditError && <p className="profile-body-metrics-message is-error" role="alert">{profileEditError}</p>}
              <button className="profile-edit-submit" type="submit" disabled={profileEditSaving || !profileEditBirthDate}><Save size={17} />{profileEditSaving ? 'Salvando...' : 'Salvar data de nascimento'}</button>
            </form>}

            {profileEditSection === 'gender' && <form className="profile-edit-form" onSubmit={handleProfileEditSubmit}>
              <p className="profile-edit-description">Selecione o gênero para completar seus dados e a referência de IMC por idade.</p>
              <div className="profile-edit-gender-options"><button type="button" aria-pressed={profileEditGender === 'MALE'} onClick={() => setProfileEditGender('MALE')}><span>Masculino</span>{profileEditGender === 'MALE' && <Check size={18} />}</button><button type="button" aria-pressed={profileEditGender === 'FEMALE'} onClick={() => setProfileEditGender('FEMALE')}><span>Feminino</span>{profileEditGender === 'FEMALE' && <Check size={18} />}</button></div>
              {profileEditError && <p className="profile-body-metrics-message is-error" role="alert">{profileEditError}</p>}
              <button className="profile-edit-submit" type="submit" disabled={profileEditSaving || !profileEditGender}><Save size={17} />{profileEditSaving ? 'Salvando...' : 'Salvar gênero'}</button>
            </form>}
          </section>
        </div>
      ), document.body)}

      <section className="profile-logout-section" aria-label="Sair da conta">
        <div><strong>Quer sair da sua conta?</strong><span>Você poderá entrar novamente a qualquer momento.</span></div>
        <StudentButton variant="secondary" type="button" onClick={handleLogout} disabled={isLoggingOut}>
          <ExitIcon />{isLoggingOut ? 'Saindo...' : 'Sair da conta'}
        </StudentButton>
      </section>

      <StudentBottomNav active="profile" showAccountMenu={false} />
    </main>
  )
}

export default ProfilePage
