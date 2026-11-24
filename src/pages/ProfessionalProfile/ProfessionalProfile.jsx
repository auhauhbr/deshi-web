import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProfessionalNavigation from '../../components/ProfessionalNavigation.jsx'
import { api } from '../../services/api.js'
import { getApiErrorMessage, logoutUser } from '../../services/authService.js'
import { getMinhasModalidades, getModalidades, saveModalidades } from '../../services/modalidades.service.js'
import { listarAtividades } from '../../services/atividades.service.js'
import './ProfessionalProfile.css'

function readSessionUser() {
  try {
    return JSON.parse(localStorage.getItem('deshi.user') || '{}')
  } catch {
    return {}
  }
}

function initials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toLocaleUpperCase('pt-BR')).join('') || 'P'
}

export default function ProfessionalProfilePage() {
  const navigate = useNavigate()
  const [user] = useState(readSessionUser)
  const [state, setState] = useState({ phase: 'loading', catalog: [], selected: [], students: [], programs: [], activities: [], error: '' })
  const [selected, setSelected] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      getModalidades(controller.signal),
      getMinhasModalidades(controller.signal),
      api.get('/vinculos/alunos', { signal: controller.signal }).then(({ data }) => data),
      api.get('/programas', { signal: controller.signal }).then(({ data }) => data),
      listarAtividades({}, controller.signal),
    ]).then(([catalog, mine, students, programs, activities]) => {
      if (controller.signal.aborted) return
      const selectedIds = mine.map((item) => item.id)
      setSelected(new Set(selectedIds))
      setState({ phase: 'ready', catalog, selected: mine, students, programs, activities, error: '' })
    }).catch((error) => {
      if (!controller.signal.aborted) setState((current) => ({ ...current, phase: 'error', error: getApiErrorMessage(error, 'Não foi possível carregar seu perfil.') }))
    })
    return () => controller.abort()
  }, [attempt])

  const selectedIds = useMemo(() => new Set([...selected]), [selected])
  const isDirty = useMemo(() => {
    const initial = new Set(state.selected.map((item) => item.id))
    return initial.size !== selectedIds.size || [...initial].some((id) => !selectedIds.has(id))
  }, [selectedIds, state.selected])
  const personalActivities = state.activities.filter((item) => item.origem === 'PERSONALIZADA' && selectedIds.has(item.modalidadeId))

  function toggleModality(id) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setFeedback(null)
  }

  async function handleSave() {
    if (saving || !isDirty) return
    if (!selected.size) {
      setFeedback({ type: 'error', message: 'Mantenha ao menos uma modalidade selecionada.' })
      return
    }
    setSaving(true)
    setFeedback(null)
    try {
      const saved = await saveModalidades([...selected])
      setSelected(new Set(saved.map((item) => item.id)))
      setState((current) => ({ ...current, selected: saved }))
      setFeedback({ type: 'success', message: 'Modalidades de atuação atualizadas.' })
    } catch (error) {
      setFeedback({ type: 'error', message: getApiErrorMessage(error, 'Não foi possível atualizar suas modalidades.') })
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    try { await logoutUser() } catch { /* A sessão local também é removida quando a API está indisponível. */ }
    navigate('/login', { replace: true, state: { message: 'Você saiu da sua conta com segurança.' } })
  }

  return (
    <main className="professional-profile-page">
      <ProfessionalNavigation />
      <div className="professional-profile-content">
        <header className="professional-profile-header">
          <div><span className="professional-profile-eyebrow">SUA CONTA</span><h1>Perfil</h1><p>Seus dados e sua área de atuação.</p></div>
        </header>

        <section className="professional-profile-identity" aria-label="Dados da conta">
          <div className="professional-profile-avatar" aria-hidden="true">{initials(user.name)}</div>
          <div className="professional-profile-identity__copy"><span>PROFISSIONAL</span><h2>{user.name || 'Seu perfil profissional'}</h2><p>{user.email || 'E-mail não informado'}</p></div>
          <span className="professional-profile-status"><i aria-hidden="true" /> Conta ativa</span>
        </section>

        {state.phase === 'loading' ? <div className="professional-profile-state" role="status"><span className="professional-profile-spinner" aria-hidden="true" />Carregando seus dados...</div>
          : state.phase === 'error' ? <div className="professional-profile-state is-error"><p role="alert">{state.error}</p><button type="button" className="profile-secondary-button" onClick={() => { setState((current) => ({ ...current, phase: 'loading', error: '' })); setAttempt((value) => value + 1) }}>Tentar novamente</button></div>
            : <>
              <section className="professional-profile-stats" aria-label="Resumo da sua conta">
                <article className="professional-profile-stat"><span>Alunos vinculados</span><strong>{state.students.length}</strong><small>com acesso à sua área</small></article>
                <article className="professional-profile-stat"><span>Programas de treino</span><strong>{state.programs.length}</strong><small>na sua carteira</small></article>
                <article className="professional-profile-stat"><span>Atividades próprias</span><strong>{personalActivities.length}</strong><small>nas modalidades selecionadas</small></article>
              </section>

              <section className="professional-profile-section" aria-labelledby="profile-modalities-title">
                <div className="professional-profile-section__heading"><div><span>ATUAÇÃO</span><h2 id="profile-modalities-title">Suas modalidades</h2><p>Escolha as áreas em que você trabalha. A Biblioteca e os programas usam essa seleção.</p></div><span className="professional-profile-selected-count">{selected.size} {selected.size === 1 ? 'selecionada' : 'selecionadas'}</span></div>
                {state.catalog.length ? <div className="professional-profile-modalities" role="group" aria-labelledby="profile-modalities-title">{state.catalog.map((modality) => {
                  const checked = selected.has(modality.id)
                  return <button key={modality.id} type="button" className={`professional-profile-modality${checked ? ' is-selected' : ''}`} aria-pressed={checked} disabled={saving} onClick={() => toggleModality(modality.id)}>
                    <span className="professional-profile-modality__initial" aria-hidden="true">{modality.nome.trim().charAt(0).toLocaleUpperCase('pt-BR')}</span><span>{modality.nome}</span><span className="professional-profile-modality__check" aria-hidden="true">{checked ? '✓' : '+'}</span>
                  </button>
                })}</div> : <p className="professional-profile-muted">Nenhuma modalidade disponível no catálogo.</p>}
                <div className="professional-profile-actions"><div aria-live="polite">{feedback && <p className={`professional-profile-feedback is-${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.message}</p>}</div><div className="professional-profile-actions__buttons">{isDirty && <button className="profile-secondary-button" type="button" onClick={() => { setSelected(new Set(state.selected.map((item) => item.id))); setFeedback(null) }} disabled={saving}>Descartar</button>}<button className="profile-save-button" type="button" onClick={handleSave} disabled={saving || !isDirty || selected.size === 0}>{saving ? 'Salvando...' : 'Salvar modalidades'}</button></div></div>
              </section>

              <section className="professional-profile-section professional-profile-account" aria-labelledby="account-details-title">
                <div className="professional-profile-section__heading"><div><span>CONTA</span><h2 id="account-details-title">Seus dados</h2><p>Informações usadas para identificar seu acesso.</p></div></div>
                <dl><div><dt>Nome</dt><dd>{user.name || 'Não informado'}</dd></div><div><dt>E-mail</dt><dd>{user.email || 'Não informado'}</dd></div><div><dt>Tipo de conta</dt><dd>Profissional</dd></div></dl>
              </section>
              <div className="professional-profile-logout"><div><strong>Quer sair da sua conta?</strong><span>Você poderá entrar novamente a qualquer momento.</span></div><button type="button" onClick={handleLogout} disabled={loggingOut}>{loggingOut ? 'Saindo...' : 'Sair da conta'}</button></div>
            </>}
      </div>
    </main>
  )
}
