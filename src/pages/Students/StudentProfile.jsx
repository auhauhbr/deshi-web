import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ProfessionalNavigation from '../../components/ProfessionalNavigation.jsx'
import { getProfessionalStudentDashboard } from '../../services/studentDashboardService.js'
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
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadedStudentId, setLoadedStudentId] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [showAllSessions, setShowAllSessions] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)

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
  const studentObjective = student?.objective || student?.objetivo || 'Objetivo não informado'
  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(now)

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
      <header className="student-detail-toolbar"><button className="student-detail-back" type="button" onClick={() => navigate('/alunos')} aria-label="Voltar para alunos">←</button><span>Perfil do aluno</span><span className="student-detail-toolbar__spacer" /></header>
      {profileLoading ? <p className="students-message">Carregando perfil do aluno…</p> : error ? <p className="students-message students-message--error" role="alert">{error}</p> : <>
        <section className="student-profile-hero" aria-label="Perfil do aluno">
          {studentImage ? <img className="student-profile-hero__avatar" src={studentImage} alt={`Foto de ${student.name}`} /> : <span className="student-profile-hero__avatar student-profile-hero__avatar--fallback" aria-hidden="true">{initials(student.name)}</span>}
          <div className="student-profile-hero__copy"><p className="students-eyebrow">ALUNO VINCULADO</p><h1 className="student-detail-name">{student.name}</h1><p><strong>Objetivo:</strong> {studentObjective}{student.createdAt && <> <span aria-hidden="true">·</span> desde {formatDate(student.createdAt, { month: 'short', year: 'numeric' })}</>}</p></div>
        </section>

        <div className="student-view-switch" role="tablist" aria-label="Visão do aluno">
          <button type="button" role="tab" aria-selected={activeTab === 'overview'} className={activeTab === 'overview' ? 'is-active' : ''} onClick={() => setActiveTab('overview')}>Visão geral</button>
          <button type="button" role="tab" aria-selected={activeTab === 'evolution'} className={activeTab === 'evolution' ? 'is-active' : ''} onClick={() => setActiveTab('evolution')}>Evolução</button>
        </div>

        {activeTab === 'overview' ? <div role="tabpanel" className="student-detail-content">
          <section className="student-period-stats" aria-label="Frequência de treinos">
            <article><strong>{completedThisMonth}</strong><span>treinos em {monthName}</span><small>{completedSessions.length} no histórico total</small></article>
            <article><strong>{completedThisWeek}</strong><span>nesta semana</span><small>Semana iniciada na segunda</small></article>
          </section>

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
            <div className="student-program-list">{programs.length ? programs.map((program, index) => <Link className="student-program-card" key={program.id} to={`/alunos/${studentId}/programas/${program.id}/editar`} aria-label={`Editar programa ${program.nome}`}>
              <span className={`student-program-card__mark student-program-card__mark--${index % 4}`}>{String.fromCharCode(65 + (index % 26))}</span><span className="student-program-card__copy"><strong>{program.nome}</strong><span>{program.atividades?.length || 0} {(program.atividades?.length || 0) === 1 ? 'atividade' : 'atividades'}{program.modalidade?.nome ? ` · ${program.modalidade.nome}` : ''}</span></span><span className="student-program-card__meta"><span>Atualizado</span><strong>{formatDate(program.criadoEm)}</strong></span><span className="student-program-card__action" aria-hidden="true">Editar <b>↗</b></span>
            </Link>) : <div className="student-detail-empty"><span className="student-detail-empty__icon" aria-hidden="true">▤</span><strong>Nenhum programa por aqui</strong><span>Crie o primeiro treino deste aluno para começar o acompanhamento.</span></div>}</div>
            <Link className="student-add-program" to={`/alunos/${studentId}/programas/novo`}><span aria-hidden="true">＋</span> Adicionar treino</Link>
          </section>

          <section className="student-detail-section">
            <div className="student-detail-section__heading"><div><p className="students-eyebrow">HISTÓRICO</p><h2>Últimas sessões</h2></div><span className="student-detail-count">{sessions.length}</span></div>
            <div className="student-session-list">{sessionsToShow.length ? sessionsToShow.map((session) => {
              const program = programs.find((item) => item.id === session.programId)
              const completedActivities = session.activities?.filter((activity) => activity.status === 'COMPLETED').length || 0
              const totalActivities = session.activities?.length || 0
              return <article className="student-session-card" key={session.id}><span className={`student-session-card__mark student-session-card__mark--${session.status.toLowerCase()}`} aria-hidden="true">{session.status === 'COMPLETED' ? '✓' : session.status === 'IN_PROGRESS' ? '↗' : '–'}</span><div className="student-session-card__copy"><strong>{program?.nome || 'Sessão de treino'}</strong><span>{formatDate(session.startedAt, { day: '2-digit', month: 'short', year: 'numeric' })} · {totalActivities ? `${completedActivities} de ${totalActivities} atividades` : 'Atividades não registradas'}</span></div><div className="student-session-card__meta"><strong>{formatDuration(session)}</strong><span>{session.status === 'COMPLETED' ? 'Concluída' : session.status === 'IN_PROGRESS' ? 'Em andamento' : 'Interrompida'}</span></div></article>
            }) : <div className="student-detail-empty"><span className="student-detail-empty__icon" aria-hidden="true">◷</span><strong>Sem sessões registradas</strong><span>Quando o aluno iniciar um treino, o histórico aparecerá aqui.</span></div>}</div>
            {sessions.length > 4 && <button className="student-history-toggle" type="button" onClick={() => setShowAllSessions((value) => !value)}>{showAllSessions ? 'Mostrar menos' : 'Ver histórico completo'}</button>}
          </section>
        </div> : <div role="tabpanel" className="student-detail-content student-evolution">
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
