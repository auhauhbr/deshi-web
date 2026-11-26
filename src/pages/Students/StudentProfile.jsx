import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, Dumbbell, Mail, MessageSquareText } from 'lucide-react'
import ProfessionalNavigation from '../../components/ProfessionalNavigation.jsx'
import WeightTrendChart from '../../components/WeightTrendChart.jsx'
import FadeContent from '../../components/FadeContent.jsx'
import SlideTextButton from '../../components/kokonutui/slide-text-button.jsx'
import { getProfessionalStudentDashboard } from '../../services/studentDashboardService.js'
import { getAgeInfo } from '../../utils/userAge.js'
import './StudentProfile.css'

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
const WEEK_RANGE_FORMATTER = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

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

function WeekChevron({ direction }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={direction === 'previous' ? 'm14.5 5-7 7 7 7' : 'm9.5 5 7 7-7 7'} /></svg>
}

function getErrorMessage(error, fallback) {
  return error.response?.data?.mensagem || error.response?.data?.message || fallback
}

function StudentProfilePage() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadedStudentId, setLoadedStudentId] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [showAllSessions, setShowAllSessions] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const studentAgeInfo = getAgeInfo(dashboard?.bodyMetrics?.birthDate)

  useEffect(() => {
    getProfessionalStudentDashboard(studentId).then((data) => {
      if (!data.student) setError('Aluno não encontrado ou sem vínculo ativo.')
      else { setDashboard(data); setError('') }
    }).catch((requestError) => setError(getErrorMessage(requestError, 'Não foi possível carregar os dados do aluno.'))).finally(() => {
      setLoadedStudentId(studentId)
      setLoading(false)
    })
  }, [studentId])

  const student = dashboard?.student
  const sessions = dashboard?.sessions || []
  const programs = dashboard?.programs || []
  const completedSessions = sessions.filter((session) => session.status === 'COMPLETED')
  const [now] = useState(() => new Date())
  const todayKey = getDateKey(now)
  const weekDays = getWeekDays(now, weekOffset)
  const completedByDay = new Map()
  completedSessions.forEach((session) => {
    const key = getDateKey(session.finishedAt || session.startedAt)
    if (key) completedByDay.set(key, (completedByDay.get(key) || 0) + 1)
  })
  const profileLoading = loading || loadedStudentId !== studentId
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const weekStart = new Date(now)
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))
  const completedThisMonth = completedSessions.filter((session) => new Date(session.finishedAt || session.startedAt) >= monthStart).length
  const completedThisWeek = completedSessions.filter((session) => new Date(session.finishedAt || session.startedAt) >= weekStart).length
  const weeklyTraining = Array.from({ length: 8 }, (_, index) => {
    const start = new Date(weekStart)
    start.setDate(weekStart.getDate() - (7 * (7 - index)))
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    return {
      start,
      count: completedSessions.filter((session) => {
        const sessionDate = new Date(session.finishedAt || session.startedAt)
        return sessionDate >= start && sessionDate < end
      }).length,
    }
  })
  const maxWeeklyTraining = Math.max(1, ...weeklyTraining.map((week) => week.count))
  const sessionsToShow = showAllSessions ? sessions : sessions.slice(0, 4)
  const studentImage = student?.photoUrl || student?.avatarUrl || student?.fotoUrl
  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(now)
  const latestSession = sessions[0]
  const sessionComments = sessions.flatMap((session) => (session.activities || [])
    .filter((activity) => activity.execution?.comment?.trim())
    .map((activity) => ({
      comment: activity.execution.comment.trim(),
      activityName: activity.nome || 'Atividade',
      sessionId: session.id,
      programId: session.programId,
      date: activity.execution.executedAt || session.finishedAt || session.startedAt,
    })))
    .sort((first, second) => new Date(second.date) - new Date(first.date))
  const latestComment = sessionComments[0]
  const LatestFeedbackContainer = latestComment ? Link : 'section'
  const latestFeedbackProps = latestComment
    ? { to: `/professional/sessions/${encodeURIComponent(latestComment.sessionId)}`, state: { from: location.pathname }, 'aria-label': `Abrir sessão com comentário sobre ${latestComment.activityName}` }
    : {}

  function formatDate(value, options = { day: '2-digit', month: 'short' }) {
    if (!value) return 'Data não registrada'
    return new Intl.DateTimeFormat('pt-BR', options).format(new Date(value)).replace('.', '')
  }

  function formatDuration(session) {
    if (session.durationMs != null) return `${Math.max(1, Math.round(session.durationMs / 60000))} min`
    if (!session.finishedAt) return session.status === 'IN_PROGRESS' ? 'Em andamento' : 'Duração não registrada'
    const minutes = Math.max(1, Math.round((new Date(session.finishedAt) - new Date(session.startedAt)) / 60000))
    return `${minutes} min`
  }

  const metricLabels = { weight: 'Carga', repetitions: 'Repetições', reps: 'Repetições', series: 'Séries', duration: 'Duração', distance: 'Distância' }

  return <main className="students-page student-detail-page">
    <ProfessionalNavigation />
    <div className="students-page__container">
      <header className="student-detail-toolbar"><button className="student-detail-back" type="button" onClick={() => navigate('/alunos')} aria-label="Voltar para alunos"><ArrowLeft size={18} /></button><span>Perfil do aluno</span><span className="student-detail-toolbar__spacer" /></header>
      {profileLoading ? <p className="students-message">Carregando perfil do aluno…</p> : error ? <p className="students-message students-message--error" role="alert">{error}</p> : <>
        <section className="student-profile-hero" aria-label="Perfil do aluno">
          {studentImage ? <img className="student-profile-hero__avatar" src={studentImage} alt={`Foto de ${student.name}`} /> : <span className="student-profile-hero__avatar student-profile-hero__avatar--fallback" aria-hidden="true">{initials(student.name)}</span>}
          <div className="student-profile-hero__copy"><p className="students-eyebrow">ALUNO VINCULADO</p><h1 className="student-detail-name">{student.name}</h1><div className="student-profile-hero__details">{student.email && <span><Mail size={15} aria-hidden="true" />{student.email}</span>}{student.createdAt && <span><CalendarDays size={15} aria-hidden="true" />Na DESHI desde {formatDate(student.createdAt, { month: 'short', year: 'numeric' })}</span>}</div></div>
        </section>

        <div className="student-view-switch" role="tablist" aria-label="Visão do aluno">
          <button type="button" role="tab" aria-selected={activeTab === 'overview'} className={activeTab === 'overview' ? 'is-active' : ''} onClick={() => setActiveTab('overview')}>Visão geral</button>
          <button type="button" role="tab" aria-selected={activeTab === 'evolution'} className={activeTab === 'evolution' ? 'is-active' : ''} onClick={() => setActiveTab('evolution')}>Evolução</button>
        </div>

        {activeTab === 'overview' ? <div role="tabpanel" className="student-detail-content">
          <section className="student-period-stats" aria-label="Frequência de treinos">
            <article><strong>{completedThisMonth}</strong><span>treinos em {monthName}</span><small>{completedSessions.length} no histórico total</small></article>
            <article><strong>{completedThisWeek}</strong><span>nesta semana</span><small>Semana iniciada na segunda</small></article>
            <article className="student-period-stats__last"><Clock3 size={17} aria-hidden="true" /><span>Último treino</span><strong>{latestSession ? formatDate(latestSession.finishedAt || latestSession.startedAt, { day: '2-digit', month: 'short' }) : '—'}</strong><small>{latestSession ? formatDuration(latestSession) : 'Ainda sem sessões'}</small></article>
          </section>

          <LatestFeedbackContainer className={`student-latest-feedback${latestComment ? ' student-latest-feedback--link' : ''}`} aria-labelledby="student-latest-feedback-title" {...latestFeedbackProps}>
            <div className="student-latest-feedback__icon"><MessageSquareText size={18} aria-hidden="true" /></div>
            <div className="student-latest-feedback__body">
              <div className="student-latest-feedback__heading"><h2 id="student-latest-feedback-title">Retorno mais recente</h2>{latestComment && <ArrowRight className="student-latest-feedback__arrow" size={17} aria-hidden="true" />}</div>
              {latestComment ? <><blockquote>“{latestComment.comment}”</blockquote><div className="student-latest-feedback__meta"><span className="student-latest-feedback__source">{latestComment.activityName}{programs.find((program) => program.id === latestComment.programId)?.nome ? ` · ${programs.find((program) => program.id === latestComment.programId).nome}` : ''}</span><time dateTime={new Date(latestComment.date).toISOString()}>{formatDate(latestComment.date)}</time></div></> : <p className="student-latest-feedback__empty">Os comentários deixados ao concluir uma atividade aparecerão aqui.</p>}
            </div>
          </LatestFeedbackContainer>

          <section className="student-week-calendar-card" aria-labelledby="student-week-calendar-title">
            <div className="student-week-calendar-card__heading">
              <div><p className="students-eyebrow">CONSTÂNCIA</p><h2 id="student-week-calendar-title">Treinos nesta semana</h2></div>
              <div className="student-week-calendar-navigation" aria-label="Navegar entre semanas">
                <button type="button" onClick={() => setWeekOffset((offset) => offset - 1)} aria-label="Ver semana anterior"><WeekChevron direction="previous" /></button>
                <span aria-live="polite">{formatWeekRange(weekDays)}</span>
                <button type="button" onClick={() => setWeekOffset((offset) => offset + 1)} aria-label="Ver próxima semana"><WeekChevron direction="next" /></button>
              </div>
            </div>
            <div className="student-week-calendar" role="list" aria-label={`Sessões concluídas na semana ${formatWeekRange(weekDays)}`}>
              {weekDays.map((date) => {
                const key = getDateKey(date)
                const completedCount = completedByDay.get(key) || 0
                const isToday = key === todayKey
                const weekday = WEEKDAY_FORMATTER.format(date).replace('.', '')
                return <div className={`student-week-calendar__day${isToday ? ' is-today' : ''}${completedCount ? ' has-session' : ''}`} key={key} role="listitem" aria-label={`${weekday}, ${date.getDate()}${completedCount ? `: ${completedCount} ${completedCount === 1 ? 'sessão concluída' : 'sessões concluídas'}` : ''}${isToday ? ', hoje' : ''}`}>
                  <span className="student-week-calendar__weekday" aria-hidden="true">{weekday}</span>
                  <span className="student-week-calendar__number" aria-hidden="true">{date.getDate()}</span>
                  <span className="student-week-calendar__marker" aria-hidden="true">{completedCount > 1 ? completedCount : completedCount === 1 ? '✓' : ''}</span>
                </div>
              })}
            </div>
            <p className="student-week-calendar-card__note">Os dias marcados indicam sessões concluídas pelo aluno.</p>
          </section>

          <section className="student-detail-section">
            <div className="student-detail-section__heading"><div><p className="students-eyebrow">PRESCRIÇÃO</p><h2>Programas de treino</h2></div><span className="student-detail-count">{programs.length}</span></div>
            {programs.length ? <FadeContent className="student-program-list" trigger="mount" duration={0.36} stagger={0.045}>{programs.map((program, index) => <Link className="student-program-card" key={program.id} to={`/alunos/${studentId}/programas/${program.id}/editar`} aria-label={`Editar programa ${program.nome}`}>
              <span className={`student-program-card__mark student-program-card__mark--${index % 4}`}><Dumbbell size={19} aria-hidden="true" />{(program.iconeUrl || program.iconUrl) && <img src={program.iconeUrl || program.iconUrl} alt="" onError={(event) => { event.currentTarget.style.opacity = '0' }} />}</span><span className="student-program-card__copy"><strong>{program.nome}</strong><span>{program.atividades?.length || 0} {(program.atividades?.length || 0) === 1 ? 'atividade' : 'atividades'}{program.modalidade?.nome ? ` · ${program.modalidade.nome}` : ''}</span></span><span className="student-program-card__meta"><span>Criado em</span><strong>{formatDate(program.criadoEm || program.createdAt)}</strong></span><span className="student-program-card__action" aria-hidden="true">Editar <ArrowRight size={15} /></span>
            </Link>)}</FadeContent> : <div className="student-detail-empty"><span className="student-detail-empty__icon" aria-hidden="true"><Dumbbell size={19} /></span><strong>Nenhum programa por aqui</strong><span>Crie o primeiro treino deste aluno para começar o acompanhamento.</span></div>}
            <SlideTextButton className="student-add-program" text="Adicionar treino" hoverText="Montar novo programa" to={`/alunos/${studentId}/programas/novo`} animateIn={false} />
          </section>

          <section className="student-detail-section">
            <div className="student-detail-section__heading"><div><p className="students-eyebrow">HISTÓRICO</p><h2>Últimas sessões</h2></div><span className="student-detail-count">{sessions.length}</span></div>
            {sessionsToShow.length ? <FadeContent className="student-session-list" trigger="mount" duration={0.34} stagger={0.04}>{sessionsToShow.map((session) => {
              const program = programs.find((item) => item.id === session.programId)
              const completedActivities = session.activities?.filter((activity) => activity.status === 'COMPLETED').length || 0
              const totalActivities = session.activities?.length || 0
              return <Link className="student-session-card" key={session.id} to={`/professional/sessions/${encodeURIComponent(session.id)}`} state={{ from: location.pathname }} aria-label={`Ver detalhes da sessão ${program?.nome || 'de treino'}, ${formatDate(session.startedAt, { day: '2-digit', month: 'short', year: 'numeric' })}`}><span className={`student-session-card__mark student-session-card__mark--${session.status.toLowerCase()}`} aria-hidden="true">{session.status === 'COMPLETED' ? <Check size={18} /> : session.status === 'IN_PROGRESS' ? <ArrowRight size={17} /> : <Clock3 size={17} />}</span><span className="student-session-card__copy"><strong>{program?.nome || 'Sessão de treino'}</strong><span>{formatDate(session.startedAt, { day: '2-digit', month: 'short', year: 'numeric' })} · {totalActivities ? `${completedActivities} de ${totalActivities} atividades` : 'Atividades não registradas'}</span></span><span className="student-session-card__meta"><strong>{formatDuration(session)}</strong><span>{session.status === 'COMPLETED' ? 'Concluída' : session.status === 'IN_PROGRESS' ? 'Em andamento' : 'Interrompida'}</span></span><ArrowRight className="student-session-card__open" size={17} aria-hidden="true" /></Link>
            })}</FadeContent> : <div className="student-detail-empty"><span className="student-detail-empty__icon" aria-hidden="true"><Clock3 size={18} /></span><strong>Sem sessões registradas</strong><span>Quando o aluno iniciar um treino, o histórico aparecerá aqui.</span></div>}
            {sessions.length > 4 && <button className="student-history-toggle" type="button" onClick={() => setShowAllSessions((value) => !value)}>{showAllSessions ? 'Mostrar menos' : 'Ver histórico completo'}</button>}
          </section>
        </div> : <div role="tabpanel" className="student-detail-content student-evolution">
           <div className="student-detail-section__heading"><div><p className="students-eyebrow">ACOMPANHAMENTO</p><h2 id="student-body-metrics-title">Peso, altura e IMC</h2></div></div>
          <section className="student-detail-section student-body-metrics" aria-labelledby="student-body-metrics-title">
            {dashboard.bodyMetrics ? (
              <>
                <table className="student-body-metrics-table">
                  <caption>Medidas registradas pelo aluno</caption>
                  <tbody>
                    <tr><th scope="row">Peso</th><td>{dashboard.bodyMetrics.weightKg.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg</td></tr>
                    <tr><th scope="row">Altura</th><td>{dashboard.bodyMetrics.heightCm.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} cm</td></tr>
                    <tr><th scope="row">IMC</th><td><strong>{dashboard.bodyMetrics.bmi.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> kg/m²</td></tr>
                    {studentAgeInfo && <tr><th scope="row">Faixa etária</th><td>{studentAgeInfo.category} · {studentAgeInfo.age} anos</td></tr>}
                    {dashboard.bodyMetrics.gender && <tr><th scope="row">Gênero</th><td>{dashboard.bodyMetrics.gender === 'MALE' ? 'Masculino' : 'Feminino'}</td></tr>}
                  </tbody>
                </table>
                <p className="student-body-metrics-updated">Atualizado em {formatDate(dashboard.bodyMetrics.updatedAt, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                {studentAgeInfo?.age < 20 && <p className="student-body-metrics-note">Em crianças e adolescentes, a interpretação do IMC considera idade e sexo. O valor acima é o cálculo do IMC, sem classificação clínica.</p>}
              </>
            ) : <p className="student-body-metrics-empty">O aluno ainda não registrou peso e altura.</p>}
            <WeightTrendChart records={dashboard.bodyMetrics?.history ?? []} heightCm={dashboard.bodyMetrics?.heightCm} birthDate={dashboard.bodyMetrics?.birthDate} gender={dashboard.bodyMetrics?.gender} />
          </section>
          <section className="student-detail-section"><div className="student-detail-section__heading"><div><p className="students-eyebrow">DESEMPENHO</p><h2>Evolução por atividade</h2></div></div>
            <article className="student-frequency-card"><div className="student-evolution-card__heading"><div><span>REGULARIDADE</span><h3>Treinos por semana</h3></div><span>Últimas 8 semanas</span></div><svg className="student-frequency-chart" viewBox="0 0 320 150" role="img" aria-label="Treinos concluídos por semana nas últimas oito semanas"><title>Frequência semanal de treinos concluídos</title><path className="student-frequency-chart__axis" d="M20 116H310" />{weeklyTraining.map((week, index) => { const height = week.count ? Math.max(8, (week.count / maxWeeklyTraining) * 82) : 2; const x = 28 + index * 36; const y = 116 - height; return <g key={week.start.toISOString()}><rect className={index === 7 ? 'is-current' : ''} x={x} y={y} width="19" height={height} rx="5"><title>{`${week.count} ${week.count === 1 ? 'treino concluído' : 'treinos concluídos'} na semana de ${formatDate(week.start)}`}</title></rect><text x={x + 9.5} y="138" textAnchor="middle">{formatDate(week.start, { day: '2-digit', month: '2-digit' })}</text></g> })}</svg><p>{completedSessions.length ? 'Sessões concluídas pelo aluno, agrupadas pela semana de início.' : 'As sessões concluídas aparecerão aqui conforme o aluno registrar seus treinos.'}</p></article>
            {dashboard.evolution.length ? <div className="student-evolution-list">{dashboard.evolution.map((item) => {
              const values = item.points.map((point) => point.value)
              const low = Math.min(...values)
              const high = Math.max(...values)
              const x = (index) => values.length === 1 ? 50 : 30 + (index / (values.length - 1)) * 260
              const y = (value) => 124 - (high === low ? 0.5 : (value - low) / (high - low)) * 92
              const points = values.map((value, index) => `${x(index)},${y(value)}`).join(' ')
              const label = metricLabels[item.metric] || item.metric.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())
              return <article className="student-evolution-card" key={`${item.activityId}-${item.metric}`}><div className="student-evolution-card__heading"><div><span>{item.modalityName || 'Atividade'}</span><h3>{item.activityName || 'Exercício'}</h3></div><span>{label}</span></div><div className="student-evolution-card__summary"><strong>{values.at(-1)}</strong><span>{label.toLocaleLowerCase('pt-BR')} na última sessão</span></div><div className="student-evolution-card__chart-wrap"><svg viewBox="0 0 300 150" role="img" aria-label={`Gráfico de ${label} em ${item.activityName || 'exercício'}`}><title>{`Progressão de ${label} em ${item.activityName || 'exercício'}`}</title><path className="student-evolution-card__gridline" d="M30 32H292M30 78H292M30 124H292" /><polyline points={points} />{item.points.map((point, pointIndex) => <circle key={`${point.sessionId}-${point.executedAt}`} cx={x(pointIndex)} cy={y(point.value)} r="4"><title>{`${formatDate(point.executedAt)}: ${point.value} ${label.toLocaleLowerCase('pt-BR')}`}</title></circle>)}</svg><div className="student-evolution-card__dates"><span>{formatDate(item.points[0]?.executedAt)}</span><span>{formatDate(item.points.at(-1)?.executedAt)}</span></div></div><p>{values.length} {values.length === 1 ? 'registro' : 'registros'} · {low === high ? 'valor estável' : `${low} → ${high} ${label.toLocaleLowerCase('pt-BR')}`}</p></article>
            })}</div> : <div className="student-detail-empty student-detail-empty--large"><span className="student-detail-empty__icon" aria-hidden="true">⌁</span><strong>A evolução começa com os registros</strong><span>Quando as sessões tiverem cargas, repetições ou outras métricas registradas, você verá a progressão de cada atividade aqui.</span></div>}
          </section>
        </div>}
      </>}
    </div>
  </main>
}

export default StudentProfilePage
