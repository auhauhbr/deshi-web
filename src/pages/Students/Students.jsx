import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowRight, Check, ChevronRight, Clock3, Copy, Search, UserPlus, UsersRound, X } from 'lucide-react'
import SwipeDeleteCard from '../../components/SwipeDeleteCard.jsx'
import { Toaster, usePromiseToast } from '../../components/kokonutui/promise-toast.jsx'
import FadeContent from '../../components/FadeContent.jsx'
import ParticleButton from '../../components/kokonutui/particle-button.jsx'
import SlideTextButton from '../../components/kokonutui/slide-text-button.jsx'
import { api } from '../../services/api.js'
import './Students.css'

const copyButtonFeedback = {
  pendingLabel: 'Copiando…',
  successLabel: 'Código copiado!',
  errorLabel: 'Tentar novamente',
  errorMessage: 'Não foi possível copiar o código. Tente novamente ou selecione o código e copie manualmente.',
  errorDuration: null,
}

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('pt-BR')
}

function getErrorMessage(error, fallback) {
  return error.response?.data?.mensagem || error.response?.data?.message || fallback
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value)
  const previousFocus = document.activeElement
  const field = document.createElement('textarea')
  field.value = value
  field.readOnly = true
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.append(field)
  try {
    field.select()
    if (!document.execCommand('copy')) throw new Error('Não foi possível copiar o código.')
  } finally {
    field.remove()
    previousFocus?.focus({ preventScroll: true })
  }
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

  return <div className="invite-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="invite-dialog" role="dialog" aria-modal="true" aria-labelledby="invite-title">
      <button className="invite-dialog__close" type="button" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
      {invitation ? <>
        <span className="invite-dialog__success" aria-hidden="true"><Check size={20} /></span>
        <p className="students-eyebrow">CONVITE CRIADO</p><h2 id="invite-title">Compartilhe o código</h2>
        <p className="invite-dialog__description">Peça ao aluno para entrar na conta dele e aceitar o convite com este código. Ele expira em 7 dias.</p>
        <input className="invite-code" aria-label="Código do convite" value={invitation.codigo} readOnly onFocus={(event) => event.currentTarget.select()} />
        <ParticleButton
          {...copyButtonFeedback}
          className="students-primary-button"
          fullWidth
          icon={<Copy size={16} aria-hidden="true" />}
          onClick={() => copyText(invitation.codigo)}
        >
          Copiar código
        </ParticleButton>
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

function StudentRemovalDialog({ student, onCancel, onConfirm }) {
  const dialogRef = useRef(null)
  const cancelRef = useRef(null)

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    const trigger = document.activeElement
    dialog.showModal()
    cancelRef.current?.focus()
    return () => {
      dialog.close()
      trigger?.focus({ preventScroll: true })
    }
  }, [])

  return <dialog
    ref={dialogRef}
    className="student-removal-dialog"
    role="alertdialog"
    aria-labelledby="student-removal-title"
    aria-describedby="student-removal-description"
    onCancel={(event) => { event.preventDefault(); onCancel() }}
  >
    <h2 id="student-removal-title">Remover {student.name} da sua lista?</h2>
    <p id="student-removal-description">O histórico e os treinos serão preservados.</p>
    <div className="student-removal-actions">
      <button ref={cancelRef} type="button" onClick={onCancel}>Cancelar</button>
      <button type="button" onClick={onConfirm}>Remover aluno</button>
    </div>
  </dialog>
}

function StudentsPage() {
  const [students, setStudents] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [dashboard, setDashboard] = useState(null)
  const [pendingInvitations, setPendingInvitations] = useState([])
  const toaster = usePromiseToast()
  const [removingStudentId, setRemovingStudentId] = useState('')
  const [studentToRemove, setStudentToRemove] = useState(null)
  const removalRequest = useRef(null)
  const activeDeletion = useRef(false)

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

  function requestStudentRemoval(student) {
    if (removalRequest.current || activeDeletion.current) return
    return new Promise((resolve) => {
      const request = { student, resolve, confirmed: false }
      removalRequest.current = request
      setStudentToRemove(request)
    })
  }

  function finishRemovalRequest(request) {
    if (removalRequest.current !== request) return
    removalRequest.current = null
    request.resolve()
  }

  function cancelStudentRemoval() {
    setStudentToRemove(null)
    finishRemovalRequest(studentToRemove)
  }

  function removeStudent(request) {
    if (removalRequest.current !== request || request.confirmed) return
    request.confirmed = true
    const { student } = request
    setStudentToRemove(null)
    toaster.show(async () => {
      if (activeDeletion.current) {
        finishRemovalRequest(request)
        throw new Error('Já existe uma remoção em andamento.')
      }
      activeDeletion.current = true
      setRemovingStudentId(student.id)
      setError('')
      try {
        await api.delete(`/vinculos/alunos/${student.id}`)
        setStudents((current) => current.filter(({ id }) => id !== student.id))
        await loadStudents()
      } finally {
        activeDeletion.current = false
        setRemovingStudentId('')
        finishRemovalRequest(request)
      }
    }, {
      loading: 'Removendo vínculo',
      success: ['Aluno removido', student.name],
      error: (failure) => ['Falha ao remover o aluno', getErrorMessage(failure, 'Tente novamente.')],
    })
  }

  useEffect(() => { loadStudents() }, [])
  useEffect(() => () => {
    removalRequest.current?.resolve()
    removalRequest.current = null
  }, [])

  const filteredStudents = useMemo(() => students.filter((student) => student.name.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'))), [students, query])

  return <main className="students-page">
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
              {filteredStudents.map((student) => <SwipeDeleteCard as="article" key={student.id}
                label={`Remover ${student.name}`} disabled={Boolean(removingStudentId || studentToRemove)} onRemove={() => requestStudentRemoval(student)}>
                <div className="student-card">
                  <Link className="student-card__link" to={`/alunos/${student.id}`} draggable={false}>
                    <span className="student-card__avatar">{initials(student.name)}</span>
                    <span className="student-card__info"><strong>{student.name}</strong><span><i className="status-dot status-dot--done" />Aluno vinculado</span></span>
                    <span className="student-card__open">Abrir perfil <ArrowRight size={16} /></span>
                    <span className="student-card__mobile-arrow" aria-hidden="true"><ChevronRight size={19} /></span>
                  </Link>
                </div>
              </SwipeDeleteCard>)}
            </FadeContent> : <div className="students-empty"><span className="students-empty__icon"><UsersRound size={21} /></span><strong>{query ? 'Nenhum aluno encontrado' : 'Sua lista começa aqui'}</strong><span>{query ? 'Tente buscar por outro nome.' : 'Adicione um aluno para acompanhar os treinos por aqui.'}</span>{!query && <button type="button" onClick={() => setShowInvite(true)}>Adicionar primeiro aluno <ArrowRight size={15} /></button>}</div>}
          </div>
        </section>

        <aside className="students-invitations" aria-label="Convites pendentes">
          <div className="students-invitations__heading"><div><p className="students-eyebrow">AGUARDANDO ACEITE</p><h2>Convites</h2></div><span className="students-total">{pendingInvitations.length}</span></div>
          {pendingInvitations.length ? <div className="pending-invitations__list">{pendingInvitations.map((invitation) => <article className="pending-invitation" key={invitation.id}>
            <div className="pending-invitation__student"><span className="pending-invitation__icon"><Clock3 size={17} /></span><div><strong>{invitation.alunoNome}</strong><span>Expira em {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(invitation.expiraEm))}</span></div></div>
            <div className="pending-invitation__code">
              <input aria-label={`Código de convite para ${invitation.alunoNome}`} value={invitation.codigo} readOnly onFocus={(event) => event.currentTarget.select()} />
              <ParticleButton
                {...copyButtonFeedback}
                aria-label={`Copiar código de convite para ${invitation.alunoNome}`}
                icon={<Copy size={14} aria-hidden="true" />}
                onClick={() => copyText(invitation.codigo)}
              >
                Copiar
              </ParticleButton>
            </div>
          </article>)}</div> : <div className="invitations-empty"><span><Check size={17} /></span><strong>Nenhum convite pendente</strong><p>Quando convidar alguém, o código e o prazo de aceite aparecem aqui.</p></div>}
        </aside>
      </div>
      <button className="students-mobile-add" type="button" onClick={() => setShowInvite(true)}><UserPlus size={18} />Adicionar aluno</button>
    </div>
    <Toaster toaster={toaster} className="deshi-action-toasts !fixed" />
    {studentToRemove && <StudentRemovalDialog
      student={studentToRemove.student}
      onCancel={cancelStudentRemoval}
      onConfirm={() => removeStudent(studentToRemove)}
    />}
    {showInvite && <InviteStudentDialog onClose={() => setShowInvite(false)} onCreated={loadStudents} />}
  </main>
}

export default StudentsPage
