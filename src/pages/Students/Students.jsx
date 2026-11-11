import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ProfessionalNavigation from '../../components/ProfessionalNavigation.jsx'
import { api } from '../../services/api.js'
import { getProfessionalStudentDashboard } from '../../services/studentDashboardService.js'
import './Students.css'

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function getErrorMessage(error, fallback) {
  return error.response?.data?.mensagem || error.response?.data?.message || fallback
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value)
  const field = document.createElement('textarea')
  field.value = value
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.append(field)
  field.select()
  document.execCommand('copy')
  field.remove()
}

function StudentPageHeader({ eyebrow, title, action }) {
  const user = JSON.parse(localStorage.getItem('deshi.user') || '{}')
  return <header className="students-header">
    <div><p className="students-eyebrow">{eyebrow}</p><h1>{title}</h1></div>
    <div className="students-header__actions">{action}<span className="students-profile" aria-label={user.name}>{initials(user.name)}</span></div>
  </header>
}

function InviteStudentDialog({ onClose, onCreated }) {
  const [email, setEmail] = useState('')
  const [invitation, setInvitation] = useState(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { data } = await api.post('/vinculos/convites/email', { email: email.trim() })
      setInvitation(data)
      onCreated()
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Não foi possível criar o convite.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function copyInvitationCode() {
    try {
      await copyText(invitation.codigo)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return <div className="invite-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="invite-dialog" role="dialog" aria-modal="true" aria-labelledby="invite-title">
      <button className="invite-dialog__close" type="button" onClick={onClose} aria-label="Fechar">×</button>
      {invitation ? <>
        <span className="invite-dialog__success" aria-hidden="true">✓</span>
        <p className="students-eyebrow">CONVITE CRIADO</p><h2 id="invite-title">Compartilhe o código</h2>
        <p className="invite-dialog__description">Peça ao aluno para entrar na conta dele e aceitar o convite com este código. Ele expira em 7 dias.</p>
        <div className="invite-code">{invitation.codigo}</div>
        <button className="students-primary-button" type="button" onClick={copyInvitationCode}>{copied ? 'Código copiado' : 'Copiar código'}</button>
        <button className="invite-dialog__secondary" type="button" onClick={onClose}>Concluir</button>
      </> : <>
        <p className="students-eyebrow">NOVO VÍNCULO</p><h2 id="invite-title">Adicionar aluno</h2>
        <p className="invite-dialog__description">Informe o e-mail usado pelo aluno no cadastro. Vamos gerar um código para ele aceitar o convite.</p>
        <form onSubmit={submit}>
          <label className="invite-email-label" htmlFor="student-email">E-mail do aluno</label>
          <input id="student-email" className="invite-email-input" type="email" autoComplete="email" placeholder="aluno@email.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
          {error && <p className="invite-error" role="alert">{error}</p>}
          <button className="students-primary-button" type="submit" disabled={submitting}>{submitting ? 'Criando convite…' : 'Gerar convite'}</button>
        </form>
      </>}
    </section>
  </div>
}

function StudentsPage() {
  const [students, setStudents] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [dashboard, setDashboard] = useState(null)
  const [pendingInvitations, setPendingInvitations] = useState([])
  const [copiedInvitationId, setCopiedInvitationId] = useState('')
  const [removingStudentId, setRemovingStudentId] = useState('')

  async function loadStudents() {
    try {
      const [studentsResponse, dashboardResponse, invitationsResponse] = await Promise.all([
        api.get('/vinculos/alunos'),
        api.get('/professional/home'),
        api.get('/vinculos/convites'),
      ])
      setStudents(studentsResponse.data)
      setDashboard(dashboardResponse.data)
      setPendingInvitations(invitationsResponse.data)
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Não foi possível carregar os alunos.'))
    } finally {
      setLoading(false)
    }
  }

  async function removeStudent(student) {
    const confirmed = window.confirm(`Remover ${student.name} da sua lista? O histórico e os treinos serão preservados.`)
    if (!confirmed) return

    setRemovingStudentId(student.id)
    setError('')
    try {
      await api.delete(`/vinculos/alunos/${student.id}`)
      await loadStudents()
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Não foi possível remover o aluno.'))
    } finally {
      setRemovingStudentId('')
    }
  }

  async function copyPendingCode(invitation) {
    try {
      await copyText(invitation.codigo)
      setCopiedInvitationId(invitation.id)
      window.setTimeout(() => setCopiedInvitationId(''), 1800)
    } catch {
      setError('Não foi possível copiar o código. Selecione e copie o código manualmente.')
    }
  }

  useEffect(() => { loadStudents() }, [])

  const filteredStudents = useMemo(() => students.filter((student) => student.name.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'))), [students, query])

  return <main className="students-page">
    <ProfessionalNavigation />
    <div className="students-page__container">
      <StudentPageHeader eyebrow="SUA EQUIPE" title="Alunos" action={<button className="students-add-button students-add-button--header" type="button" onClick={() => setShowInvite(true)}><span>＋</span> Adicionar</button>} />
      <section className="students-insights" aria-label="Resumo dos alunos de hoje">
        <article className="students-insight students-insight--live"><strong>{dashboard?.counts?.training ?? '—'}</strong><span>Treinando agora</span></article>
        <article className="students-insight students-insight--done"><strong>{dashboard?.counts?.completed ?? '—'}</strong><span>Concluíram hoje</span></article>
        <article className="students-insight students-insight--pending"><strong>{dashboard?.counts?.notStarted ?? '—'}</strong><span>Sem treino hoje</span></article>
      </section>
      {pendingInvitations.length > 0 && <section className="pending-invitations" aria-label="Convites pendentes">
        <div className="students-list-heading"><div><p className="students-eyebrow">AGUARDANDO ACEITE</p><h2>Convites pendentes <span className="students-total">{pendingInvitations.length}</span></h2></div></div>
        <div className="pending-invitations__list">{pendingInvitations.map((invitation) => <article className="pending-invitation" key={invitation.id}>
          <div className="pending-invitation__student"><span className="pending-invitation__icon" aria-hidden="true">⌛</span><div><strong>{invitation.alunoNome}</strong><span>Expira em {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(invitation.expiraEm))}</span></div></div>
          <div className="pending-invitation__code"><code>{invitation.codigo}</code><button type="button" onClick={() => copyPendingCode(invitation)} aria-label={`Copiar código de convite para ${invitation.alunoNome}`}>{copiedInvitationId === invitation.id ? 'Copiado' : 'Copiar'}</button></div>
        </article>)}</div>
      </section>}
      <div className="students-list-heading"><div><p className="students-eyebrow">ACOMPANHAMENTO</p><h2>Seus alunos <span className="students-total">{students.length}</span></h2></div></div>
      <label className="students-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar aluno" aria-label="Buscar aluno" /></label>
      {error && <p className="students-message students-message--error" role="alert">{error}</p>}
      <section className="students-list" aria-label="Lista de alunos">
        {loading ? <p className="students-message">Carregando alunos…</p> : filteredStudents.length ? filteredStudents.map((student, index) => <div className="student-card" key={student.id}>
          <Link className="student-card__link" to={`/alunos/${student.id}`}>
            <span className={`student-card__avatar student-card__avatar--${index % 5}`}>{initials(student.name)}</span><span className="student-card__info"><strong>{student.name}</strong><span>Aluno vinculado</span></span><span className="student-card__arrow" aria-hidden="true">›</span>
          </Link>
          <button className="student-card__remove" type="button" onClick={() => removeStudent(student)} disabled={removingStudentId === student.id} aria-label={`Remover ${student.name}`} title="Remover aluno"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/><path d="M18 4v6m-3-3h6"/></svg></button>
        </div>) : <div className="students-empty"><span className="students-empty__icon" aria-hidden="true">♧</span><strong>{query ? 'Nenhum aluno encontrado' : 'Sua lista começa aqui'}</strong><span>{query ? 'Tente buscar por outro nome.' : 'Adicione um aluno para acompanhar os treinos por aqui.'}</span></div>}
      </section>
      <button className="students-add-button students-add-button--mobile" type="button" onClick={() => setShowInvite(true)}><span>＋</span> Adicionar aluno</button>
    </div>
    {showInvite && <InviteStudentDialog onClose={() => setShowInvite(false)} onCreated={loadStudents} />}
  </main>
}

function StudentDetailPage() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showAllSessions, setShowAllSessions] = useState(false)

  useEffect(() => {
    setLoading(true)
    getProfessionalStudentDashboard(studentId).then((data) => {
      if (!data.student) setError('Aluno não encontrado ou sem vínculo ativo.')
      else { setDashboard(data); setError('') }
    }).catch((requestError) => setError(getErrorMessage(requestError, 'Não foi possível carregar os dados do aluno.'))).finally(() => setLoading(false))
  }, [studentId])

  const student = dashboard?.student
  const sessions = dashboard?.sessions || []
  const programs = dashboard?.programs || []
  const completedSessions = sessions.filter((session) => session.status === 'COMPLETED')
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const weekStart = new Date(now)
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))
  const completedThisMonth = completedSessions.filter((session) => new Date(session.finishedAt || session.startedAt) >= monthStart).length
  const completedThisWeek = completedSessions.filter((session) => new Date(session.finishedAt || session.startedAt) >= weekStart).length
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
      {loading ? <p className="students-message">Carregando perfil do aluno…</p> : error ? <p className="students-message students-message--error" role="alert">{error}</p> : <>
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

          <section className="student-detail-section">
            <div className="student-detail-section__heading"><div><p className="students-eyebrow">PRESCRIÇÃO</p><h2>Programas de treino</h2></div><span className="student-detail-count">{programs.length}</span></div>
            <div className="student-program-list">{programs.length ? programs.map((program, index) => <article className="student-program-card" key={program.id}>
              <span className={`student-program-card__mark student-program-card__mark--${index % 4}`}>{String.fromCharCode(65 + (index % 26))}</span><div className="student-program-card__copy"><strong>{program.nome}</strong><span>{program.atividades?.length || 0} {(program.atividades?.length || 0) === 1 ? 'atividade' : 'atividades'}{program.modalidade?.nome ? ` · ${program.modalidade.nome}` : ''}</span></div><div className="student-program-card__meta"><span>Atualizado</span><strong>{formatDate(program.criadoEm)}</strong></div>
            </article>) : <div className="student-detail-empty"><span className="student-detail-empty__icon" aria-hidden="true">▤</span><strong>Nenhum programa por aqui</strong><span>Os treinos prescritos para este aluno aparecerão nesta seção.</span></div>}</div>
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
            {dashboard.evolution.length ? <div className="student-evolution-list">{dashboard.evolution.map((item) => {
              const values = item.points.map((point) => point.value)
              const low = Math.min(...values)
              const high = Math.max(...values)
              const points = values.map((value, index) => `${values.length === 1 ? 50 : 8 + (index / (values.length - 1)) * 84},${38 - (high === low ? 0.5 : (value - low) / (high - low)) * 28}`).join(' ')
              const label = metricLabels[item.metric] || item.metric.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())
              return <article className="student-evolution-card" key={`${item.activityId}-${item.metric}`}><div className="student-evolution-card__heading"><div><span>{item.modalityName || 'Atividade'}</span><h3>{item.activityName || 'Exercício'}</h3></div><span>{label}</span></div><div className="student-evolution-card__chart"><div><strong>{values.at(-1)}</strong><span>{label.toLocaleLowerCase('pt-BR')} na última sessão</span></div><svg viewBox="0 0 100 44" role="img" aria-label={`Evolução de ${label} em ${item.activityName || 'exercício'}`}><polyline points={points} /><circle cx={values.length === 1 ? 50 : 92} cy={38 - (high === low ? 0.5 : (values.at(-1) - low) / (high - low)) * 28} r="3" /></svg></div><p>{values.length} registros · {formatDate(item.points[0]?.executedAt)} a {formatDate(item.points.at(-1)?.executedAt)}</p></article>
            })}</div> : <div className="student-detail-empty student-detail-empty--large"><span className="student-detail-empty__icon" aria-hidden="true">⌁</span><strong>A evolução começa com os registros</strong><span>Quando as sessões tiverem cargas, repetições ou outras métricas registradas, você verá a progressão de cada atividade aqui.</span></div>}
          </section>
        </div>}
      </>}
    </div>
  </main>
}

export { StudentDetailPage }
export default StudentsPage
