import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowRight, Check, ChevronRight, Clock3, Copy, Search, Trash2, UserPlus, UsersRound, X } from 'lucide-react'
import ProfessionalNavigation from '../../components/ProfessionalNavigation.jsx'
import FadeContent from '../../components/FadeContent.jsx'
import SlideTextButton from '../../components/kokonutui/slide-text-button.jsx'
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

function StudentPageHeader({ action }) {
  return <header className="students-header">
    <div className="students-header__copy">
      <p className="students-eyebrow">GESTÃO DE CLIENTELA</p>
      <h1>Alunos</h1>
      <p className="students-header__description">Acompanhe sua equipe e mantenha cada vínculo em dia.</p>
    </div>
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
      <button className="invite-dialog__close" type="button" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
      {invitation ? <>
        <span className="invite-dialog__success" aria-hidden="true"><Check size={20} /></span>
        <p className="students-eyebrow">CONVITE CRIADO</p><h2 id="invite-title">Compartilhe o código</h2>
        <p className="invite-dialog__description">Peça ao aluno para entrar na conta dele e aceitar o convite com este código. Ele expira em 7 dias.</p>
        <div className="invite-code">{invitation.codigo}</div>
        <button className="students-primary-button" type="button" onClick={copyInvitationCode}><Copy size={16} />{copied ? 'Código copiado' : 'Copiar código'}</button>
        <button className="invite-dialog__secondary" type="button" onClick={onClose}>Concluir</button>
      </> : <>
        <p className="students-eyebrow">NOVO VÍNCULO</p><h2 id="invite-title">Adicionar aluno</h2>
        <p className="invite-dialog__description">Informe o e-mail usado pelo aluno no cadastro. Vamos gerar um código para ele aceitar o convite.</p>
        <form onSubmit={submit}>
          <label className="invite-email-label" htmlFor="student-email">E-mail do aluno</label>
          <input id="student-email" className="invite-email-input" type="email" autoComplete="email" placeholder="aluno@email.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
          {error && <p className="invite-error" role="alert">{error}</p>}
          <button className="students-primary-button" type="submit" disabled={submitting}>{submitting ? 'Criando convite…' : 'Gerar convite'}<ArrowRight size={16} /></button>
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
      <StudentPageHeader action={<SlideTextButton asButton text="Adicionar aluno" hoverText="Convidar por e-mail" onClick={() => setShowInvite(true)} className="students-add-button" />} />

      <section className="students-insights" aria-label="Resumo dos alunos de hoje">
        <div className="students-insights__heading"><Activity size={17} /><span>Hoje na equipe</span></div>
        <div className="students-insights__metrics">
          <article className="students-insight"><strong>{dashboard?.counts?.training ?? '—'}</strong><span><i className="status-dot status-dot--live" />Treinando agora</span></article>
          <article className="students-insight"><strong>{dashboard?.counts?.completed ?? '—'}</strong><span><i className="status-dot status-dot--done" />Concluíram hoje</span></article>
          <article className="students-insight"><strong>{dashboard?.counts?.notStarted ?? '—'}</strong><span><i className="status-dot" />Sem treino hoje</span></article>
        </div>
      </section>

      {error && <p className="students-message students-message--error" role="alert">{error}</p>}

      <div className="students-workspace">
        <section className="students-roster" aria-label="Lista de alunos">
          <div className="students-roster__heading">
            <div><p className="students-eyebrow">ACOMPANHAMENTO</p><h2>Seus alunos <span className="students-total">{students.length}</span></h2></div>
            <span className="students-roster__caption"><UsersRound size={15} />Vínculos ativos</span>
          </div>
          <label className="students-search"><Search size={18} aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome" aria-label="Buscar aluno" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Limpar busca"><X size={15} /></button>}</label>

          <div className="students-list">
            {loading ? <div className="students-loading" aria-label="Carregando alunos">{[0, 1, 2].map((item) => <div className="students-skeleton" key={item}><span /><i /><b /></div>)}</div> : filteredStudents.length ? <FadeContent className="students-list__items" trigger="mount" duration={0.42} stagger={0.055}>
              {filteredStudents.map((student) => <article className="student-card" key={student.id}>
                <Link className="student-card__link" to={`/alunos/${student.id}`}>
                  <span className="student-card__avatar">{initials(student.name)}</span>
                  <span className="student-card__info"><strong>{student.name}</strong><span><i className="status-dot status-dot--done" />Aluno vinculado</span></span>
                  <span className="student-card__open">Abrir perfil <ArrowRight size={16} /></span>
                  <span className="student-card__mobile-arrow" aria-hidden="true"><ChevronRight size={19} /></span>
                </Link>
                <button className="student-card__remove" type="button" onClick={() => removeStudent(student)} disabled={removingStudentId === student.id} aria-label={`Remover ${student.name}`} title="Remover aluno"><Trash2 size={17} /></button>
              </article>)}
            </FadeContent> : <div className="students-empty"><span className="students-empty__icon"><UsersRound size={21} /></span><strong>{query ? 'Nenhum aluno encontrado' : 'Sua lista começa aqui'}</strong><span>{query ? 'Tente buscar por outro nome.' : 'Adicione um aluno para acompanhar os treinos por aqui.'}</span>{!query && <button type="button" onClick={() => setShowInvite(true)}>Adicionar primeiro aluno <ArrowRight size={15} /></button>}</div>}
          </div>
        </section>

        <aside className="students-invitations" aria-label="Convites pendentes">
          <div className="students-invitations__heading"><div><p className="students-eyebrow">AGUARDANDO ACEITE</p><h2>Convites</h2></div><span className="students-total">{pendingInvitations.length}</span></div>
          {pendingInvitations.length ? <div className="pending-invitations__list">{pendingInvitations.map((invitation) => <article className="pending-invitation" key={invitation.id}>
            <div className="pending-invitation__student"><span className="pending-invitation__icon"><Clock3 size={17} /></span><div><strong>{invitation.alunoNome}</strong><span>Expira em {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(invitation.expiraEm))}</span></div></div>
            <div className="pending-invitation__code"><code>{invitation.codigo}</code><button type="button" onClick={() => copyPendingCode(invitation)} aria-label={`Copiar código de convite para ${invitation.alunoNome}`}>{copiedInvitationId === invitation.id ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}</button></div>
          </article>)}</div> : <div className="invitations-empty"><span><Check size={17} /></span><strong>Nenhum convite pendente</strong><p>Quando convidar alguém, o código e o prazo de aceite aparecem aqui.</p></div>}
        </aside>
      </div>
      <button className="students-mobile-add" type="button" onClick={() => setShowInvite(true)}><UserPlus size={18} />Adicionar aluno</button>
    </div>
    {showInvite && <InviteStudentDialog onClose={() => setShowInvite(false)} onCreated={loadStudents} />}
  </main>
}

export default StudentsPage
