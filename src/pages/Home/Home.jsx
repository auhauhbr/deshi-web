import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, CalendarDays, Check, CirclePlay, Clock3, Dumbbell, History, TicketCheck } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AppBottomNav from '../../components/AppBottomNav.jsx'
import StudentButton from '../../components/StudentButton.jsx'
import StudentHeader from '../../components/StudentHeader.jsx'
import { getApiErrorMessage, getStoredUser } from '../../services/authService.js'
import { getStudentProfessionals, getStudentPrograms, getStudentSessions } from '../../services/sessionService.js'
import { resumeApiLoadingScreen } from '../../services/apiLoadingState.js'
import './Home.css'

const FitnessScene = lazy(() => import('../../components/FitnessScene.jsx'))

const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

function dateKey(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDate(value, options = { day: 'numeric', month: 'short' }) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', options).format(date)
}

function sessionTime(session) {
  return session?.finishedAt || session?.startedAt
}

function greetingForNow() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function ProgramMark({ program }) {
  const [imageFailed, setImageFailed] = useState(false)
  if (program?.iconeUrl && !imageFailed) {
    return <img className="student-home-program-mark" src={program.iconeUrl} alt="" loading="lazy" onError={() => setImageFailed(true)} />
  }
  return <span className="student-home-program-mark student-home-program-mark--fallback" aria-hidden="true"><Dumbbell size={22} strokeWidth={1.7} /></span>
}

function HomePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const user = getStoredUser()
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'atleta'
  const [now] = useState(() => new Date())
  const [isLoginRevealVisible, setIsLoginRevealVisible] = useState(() => (
    Boolean(location.state?.playLoginReveal)
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ))
  const [dashboard, setDashboard] = useState({ programs: [], sessions: [], professionals: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)

  function finishLoginReveal() {
    setIsLoginRevealVisible(false)
    resumeApiLoadingScreen()
  }

  useEffect(() => {
    if (location.state?.playLoginReveal && !isLoginRevealVisible) resumeApiLoadingScreen()
  }, [isLoginRevealVisible, location.state])

  useEffect(() => {
    if (!location.state?.playLoginReveal) return
    navigate('/home', { replace: true, state: { profile: location.state.profile } })
  }, [location.state, navigate])

  useEffect(() => {
    if (!isLoginRevealVisible) return undefined
    function skipOnEscape(event) {
      if (event.key === 'Escape') finishLoginReveal()
    }
    window.addEventListener('keydown', skipOnEscape)
    const playPromise = videoRef.current?.play()
    playPromise?.catch(finishLoginReveal)
    return () => window.removeEventListener('keydown', skipOnEscape)
  }, [isLoginRevealVisible])

  useEffect(() => {
    let isCurrent = true
    async function loadDashboard() {
      setIsLoading(true)
      setLoadError('')
      try {
        const [programs, sessions, professionals] = await Promise.all([
          getStudentPrograms({ skipGlobalLoading: true }),
          getStudentSessions({ skipGlobalLoading: true }),
          getStudentProfessionals({ skipGlobalLoading: true }),
        ])
        if (!isCurrent) return
        setDashboard({
          programs,
          sessions: [...sessions].sort((a, b) => new Date(sessionTime(b)) - new Date(sessionTime(a))),
          professionals,
        })
      } catch (error) {
        if (isCurrent) setLoadError(getApiErrorMessage(error, 'Não foi possível carregar sua rotina agora.'))
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }
    loadDashboard()
    return () => { isCurrent = false }
  }, [loadAttempt])

  const today = dateKey(now)
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)

  const completedSessions = useMemo(
    () => dashboard.sessions.filter((session) => session.status === 'COMPLETED'),
    [dashboard.sessions],
  )
  const completedThisWeek = completedSessions.filter((session) => new Date(sessionTime(session)) >= monday)
  const completedTodayIds = new Set(completedSessions
    .filter((session) => dateKey(sessionTime(session)) === today)
    .map((session) => String(session.programId)))
  const recommendedToday = dashboard.programs.filter((program) => {
    const configuredDays = program.recommendedDays || program.diasRecomendados || program.daysOfWeek || []
    const recommendedByProfessional = configuredDays.some((day) => Number(day) === now.getDay() || String(day).toLowerCase() === WEEKDAYS[now.getDay()])
    const trainedThisWeek = completedThisWeek.some((session) => String(session.programId) === String(program.id))
    return recommendedByProfessional || trainedThisWeek
  })
  const nextProgram = recommendedToday.find((program) => !completedTodayIds.has(String(program.id))) || recommendedToday[0] || dashboard.programs[0]
  const activeSession = dashboard.sessions.find((session) => ['IN_PROGRESS', 'PAUSED'].includes(session.status))
  const activeProgram = dashboard.programs.find((program) => String(program.id) === String(activeSession?.programId))
  const recentSessions = dashboard.sessions.filter((session) => ['COMPLETED', 'INTERRUPTED'].includes(session.status)).slice(0, 3)
  const latestCompleted = completedSessions[0]
  const allRecommendedDone = recommendedToday.length > 0 && recommendedToday.every((program) => completedTodayIds.has(String(program.id)))

  const dateLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(now)

  return (
    <main className="home-page student-home-page">
      <StudentHeader className="home-header" />
      <section className="home-content" aria-label="Resumo da sua rotina">
        <div className="student-home-dashboard">
          <section className="home-card" aria-labelledby="student-home-title">
            <div className="home-copy">
              <p className="home-eyebrow"><CalendarDays size={14} aria-hidden="true" /> {dateLabel}</p>
              <h1 id="student-home-title">{greetingForNow()}, {firstName}.</h1>
              <p>Seus programas, histórico e rotina de treino em um só lugar.</p>
              <StudentButton variant="primary" className="home-start-session" onClick={() => navigate('/sessions/start')}>
                Ver meus treinos <ArrowRight size={17} aria-hidden="true" />
              </StudentButton>
            </div>
            <div className="home-visual" aria-hidden="true">
              <div className="home-visual-orbit home-visual-orbit-outer" />
              <div className="home-visual-orbit home-visual-orbit-inner" />
              <Suspense fallback={<div className="fitness-scene-loading" />}><FitnessScene /></Suspense>
            </div>
          </section>

          <nav className="student-home-shortcuts" aria-label="Ações rápidas">
            <Link to="/sessions/start"><Dumbbell size={17} aria-hidden="true" /><span>Treinos</span><ArrowRight size={14} aria-hidden="true" /></Link>
            <Link to="/sessions/completed"><History size={17} aria-hidden="true" /><span>Histórico</span><ArrowRight size={14} aria-hidden="true" /></Link>
            <Link to="/invites/accept"><TicketCheck size={17} aria-hidden="true" /><span>Vínculos</span><ArrowRight size={14} aria-hidden="true" /></Link>
          </nav>

          {loadError && <div className="student-home-feedback" role="alert"><p>{loadError}</p><StudentButton variant="secondary" onClick={() => { setLoadAttempt((attempt) => attempt + 1) }}>Tentar novamente</StudentButton></div>}

          {!loadError && activeSession && (
            <Link className="student-home-resume" to={`/sessions/${activeSession.id}`} state={{ session: activeSession, programName: activeProgram?.name }}>
              <span className="student-home-resume__status"><CirclePlay size={17} aria-hidden="true" /> {activeSession.status === 'PAUSED' ? 'Sessão pausada' : 'Sessão em andamento'}</span>
              <span className="student-home-resume__main"><strong>{activeProgram?.name || 'Seu treino'}</strong><span>{activeSession.activities?.filter((activity) => activity.status === 'COMPLETED').length || 0} de {activeSession.activities?.length || 0} atividades concluídas</span></span>
              <span className="student-home-resume__action">Retomar <ArrowRight size={17} aria-hidden="true" /></span>
            </Link>
          )}

          <section className="student-home-workout" aria-labelledby="student-home-workout-title">
            <div className="student-home-section-heading">
              <div><p className="student-home-kicker">ROTINA DE HOJE</p><h2 id="student-home-workout-title">{allRecommendedDone ? 'Treinos do dia concluídos' : 'Seu próximo treino'}</h2></div>
              <Link to="/sessions/start" className="student-home-text-link">Ver todos <ArrowRight size={15} aria-hidden="true" /></Link>
            </div>
            {isLoading ? (
              <div className="student-home-workout-card student-home-skeleton" role="status"><span /><div><span /><span /></div></div>
            ) : nextProgram ? (
              <Link className="student-home-workout-card" to={`/sessions/preview/${nextProgram.id}`} state={{ program: nextProgram, returnTo: '/home' }}>
                <ProgramMark program={nextProgram} />
                <span className="student-home-workout-copy"><strong>{nextProgram.name}</strong><span>{allRecommendedDone && completedTodayIds.has(String(nextProgram.id)) ? 'Feito hoje · toque para repetir' : `${nextProgram.activities?.length || 0} atividades${nextProgram.professionalName ? ` · ${nextProgram.professionalName}` : ''}`}</span></span>
                <span className="student-home-workout-action"><span>Visualizar</span><ArrowRight size={18} aria-hidden="true" /></span>
              </Link>
            ) : (
              <div className="student-home-empty-workout">
                <div><strong>{dashboard.professionals.length ? 'Ainda sem programas' : 'Conecte-se ao seu profissional'}</strong><p>{dashboard.professionals.length ? 'Quando seu profissional enviar um treino, ele aparecerá aqui.' : 'Depois de vincular seu profissional, seus treinos vão aparecer nesta tela.'}</p></div>
                <Link to={dashboard.professionals.length ? '/sessions/start' : '/invites/accept'} aria-label={dashboard.professionals.length ? 'Abrir programas' : 'Vincular profissional'}><ArrowRight size={18} aria-hidden="true" /></Link>
              </div>
            )}
          </section>

          <section className="student-home-overview" aria-label="Resumo da semana">
            <article><span className="student-home-stat-icon"><Check size={16} aria-hidden="true" /></span><span className="student-home-stat-value">{isLoading ? '—' : completedThisWeek.length}</span><span className="student-home-stat-label">treinos nesta semana</span></article>
            <article><span className="student-home-stat-icon"><Dumbbell size={16} aria-hidden="true" /></span><span className="student-home-stat-value">{isLoading ? '—' : dashboard.programs.length}</span><span className="student-home-stat-label">programas disponíveis</span></article>
            <article><span className="student-home-stat-icon"><Clock3 size={16} aria-hidden="true" /></span><span className="student-home-stat-value student-home-stat-value--date">{isLoading ? '—' : formatDate(latestCompleted && sessionTime(latestCompleted))}</span><span className="student-home-stat-label">último treino concluído</span></article>
          </section>

          <section className="student-home-recent" aria-labelledby="student-home-recent-title">
            <div className="student-home-section-heading"><div><p className="student-home-kicker">SEU CAMINHO</p><h2 id="student-home-recent-title">Treinos recentes</h2></div><Link to="/sessions/completed" className="student-home-text-link">Histórico completo <ArrowRight size={15} aria-hidden="true" /></Link></div>
            {isLoading ? <div className="student-home-recent-loading" role="status">Carregando sua atividade...</div> : recentSessions.length ? (
              <div className="student-home-recent-list">
                {recentSessions.map((session) => {
                  const program = dashboard.programs.find((item) => String(item.id) === String(session.programId))
                  const interrupted = session.status === 'INTERRUPTED'
                  return <Link to={`/sessions/${session.id}`} className="student-home-recent-item" key={session.id}>
                    <span className={`student-home-recent-mark${interrupted ? ' is-interrupted' : ''}`} aria-hidden="true">{interrupted ? '–' : <Check size={15} />}</span>
                    <span className="student-home-recent-copy"><strong>{program?.name || 'Treino'}</strong><span>{interrupted ? 'Interrompido' : 'Concluído'} · {session.activities?.length || 0} atividades</span></span>
                    <time dateTime={sessionTime(session)}>{formatDate(sessionTime(session))}</time>
                  </Link>
                })}
              </div>
            ) : <p className="student-home-recent-empty">Suas sessões concluídas vão aparecer aqui.</p>}
          </section>
        </div>
      </section>
      <AppBottomNav active="home" />
      {isLoginRevealVisible && (
        <div className="login-transition-overlay" role="status" aria-label="Animação de entrada do Deshi">
          <div className="login-transition-crop">
            <video ref={videoRef} className="login-transition-video" src="/login-transition.mp4" autoPlay muted playsInline preload="auto" onEnded={finishLoginReveal} onError={finishLoginReveal} />
          </div>
        </div>
      )}
    </main>
  )
}

export default HomePage
