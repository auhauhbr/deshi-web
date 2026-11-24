import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ProfessionalNavigation from '../../components/ProfessionalNavigation.jsx'
import { api } from '../../services/api.js'
import './Students.css'

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('pt-BR')
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
  return <header className="students-header">
    <div><p className="students-eyebrow">{eyebrow}</p><h1>{title}</h1></div>
    <div className="students-header__actions">{action}</div>
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


export default StudentsPage
