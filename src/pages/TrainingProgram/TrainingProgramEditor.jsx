import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Dumbbell, Plus, Save, UserRound } from 'lucide-react'
import SwipeDeleteCard from '../../components/SwipeDeleteCard.jsx'
import MorphPopover from '../../components/kokonutui/morph-popover.jsx'
import { Toaster, usePromiseToast } from '../../components/kokonutui/promise-toast.jsx'
import { api } from '../../services/api.js'
import { getApiErrorMessage } from '../../services/authService.js'
import { listarAtividades } from '../../services/atividades.service.js'
import { getMinhasModalidades } from '../../services/modalidades.service.js'
import { atualizarPrograma, buscarPrograma, criarPrograma } from '../../services/programas.service.js'
import './TrainingProgramEditor.css'

const EMPTY_DRAFT = (studentId) => ({ nome: '', iconeUrl: '', alunoId: studentId, modalidadeId: '', atividades: [] })

function TrainingProgramEditorPage() {
  const { studentId, programId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [screen, setScreen] = useState({ phase: 'loading', student: null, modalidades: [], draft: null, error: '' })
  const [nameError, setNameError] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const toaster = usePromiseToast()
  const [pendingRemovals, setPendingRemovals] = useState(() => new Set())
  const incomingDraft = location.state?.programDraft

  useEffect(() => {
    const controller = new AbortController()
    setScreen((current) => ({ ...current, phase: 'loading', error: '' }))
    Promise.all([
      api.get('/vinculos/alunos', { signal: controller.signal }).then(({ data }) => data),
      getMinhasModalidades(controller.signal),
      listarAtividades({}, controller.signal),
      programId ? buscarPrograma(programId, controller.signal) : Promise.resolve(null),
    ]).then(([students, modalidades, catalog, persistedProgram]) => {
      if (controller.signal.aborted) return
      const student = students.find((item) => item.id === studentId)
      if (!student) {
        setScreen({ phase: 'error', student: null, modalidades, draft: null, error: 'Aluno não encontrado ou sem vínculo ativo.' })
        return
      }
      if (persistedProgram && persistedProgram.alunoId !== studentId) {
        setScreen({ phase: 'error', student, modalidades, draft: null, error: 'Este programa não pertence ao aluno informado.' })
        return
      }
      const catalogById = new Map(catalog.map((activity) => [activity.id, activity]))
      const storedDraft = persistedProgram ? {
        nome: persistedProgram.nome,
        iconeUrl: persistedProgram.iconeUrl || '',
        alunoId: persistedProgram.alunoId,
        modalidadeId: persistedProgram.modalidadeId,
        atividades: persistedProgram.atividades.map((item) => ({
          ...(catalogById.get(item.atividadeId) || {}),
          atividadeId: item.atividadeId,
          ordem: item.ordem,
          ...(item.valores ? { valores: item.valores } : {}),
        })),
      } : EMPTY_DRAFT(studentId)
      const draft = incomingDraft?.alunoId === studentId ? incomingDraft : storedDraft
      setScreen({ phase: 'ready', student, modalidades, draft, catalog, error: '' })
    }).catch((failure) => {
      if (!controller.signal.aborted) setScreen({ phase: 'error', student: null, modalidades: [], draft: null, error: getApiErrorMessage(failure, 'Não foi possível carregar os dados do programa.') })
    })
    return () => controller.abort()
  }, [studentId, programId, incomingDraft])

  useEffect(() => {
    if (!incomingDraft || incomingDraft.alunoId !== studentId) return
    setScreen((current) => current.phase === 'ready'
      ? { ...current, draft: incomingDraft }
      : current)
  }, [incomingDraft, studentId])

  const draft = screen.draft
  const visibleActivities = draft?.atividades.filter((item) => !pendingRemovals.has(item.atividadeId)) ?? []
  const waitingForUndo = pendingRemovals.size > 0
  const modalityNames = useMemo(() => new Map(screen.modalidades.map((item) => [item.id, item.nome])), [screen.modalidades])
  const editProfilePath = `/alunos/${studentId}`

  function updateDraft(update) {
    setScreen((current) => ({ ...current, draft: { ...current.draft, ...update } }))
    setError('')
  }

  function openActivityLibrary() {
    if (!draft?.modalidadeId || saving || waitingForUndo) return
    navigate(location.pathname, { replace: true, state: { programDraft: draft } })
    navigate(`/atividades?modalidadeId=${encodeURIComponent(draft.modalidadeId)}`, {
      state: { programDraft: draft, returnTo: location.pathname },
    })
  }

  function moveActivity(index, direction) {
    const target = index + direction
    if (target < 0 || target >= visibleActivities.length) return
    const activities = [...draft.atividades]
    const from = activities.indexOf(visibleActivities[index])
    const to = activities.indexOf(visibleActivities[target])
    ;[activities[from], activities[to]] = [activities[to], activities[from]]
    updateDraft({ atividades: activities.map((item, order) => ({ ...item, ordem: order + 1 })) })
  }

  function removeActivity(activity) {
    const activityId = activity.atividadeId
    if (saving || pendingRemovals.has(activityId)) return

    function clearPending() {
      setPendingRemovals((current) => {
        const next = new Set(current)
        next.delete(activityId)
        return next
      })
    }

    toaster.show(async () => {
      setPendingRemovals((current) => new Set([...current, activityId]))
      setError('')
    }, {
      loading: 'Removendo atividade',
      success: ['Atividade removida', activity.nome || 'Rascunho do programa'],
      error: 'Não foi possível restaurar a atividade',
      onExpire: () => {
        setScreen((current) => {
          const activities = current.draft.atividades.filter((item) => item.atividadeId !== activityId)
          return { ...current, draft: { ...current.draft, atividades: activities.map((item, order) => ({ ...item, ordem: order + 1 })) } }
        })
        clearPending()
      },
      undo: {
        success: 'Atividade restaurada',
        run: async () => clearPending(),
      },
    })
  }

  async function handleSave(event) {
    event.preventDefault()
    if (saving || waitingForUndo || screen.phase !== 'ready') return
    if (!draft.nome.trim()) {
      setNameError('Informe um nome para o programa.')
      event.currentTarget.elements.namedItem('program-name')?.focus()
      return
    }
    if (!draft.modalidadeId) {
      setError('Selecione uma modalidade para o programa.')
      return
    }
    if (!draft.atividades.length) {
      setError('Adicione pelo menos uma atividade ao programa.')
      return
    }
    setSaving(true)
    setError('')
    const body = {
      alunoId: studentId,
      nome: draft.nome.trim(),
      ...(draft.iconeUrl?.trim() ? { iconeUrl: draft.iconeUrl.trim() } : {}),
      modalidadeId: draft.modalidadeId,
      atividades: [...draft.atividades].map((activity, index) => activity.valores
        ? { atividadeId: activity.atividadeId, ordem: index + 1, valores: activity.valores }
        : activity.atividadeId),
    }
    try {
      if (programId) await atualizarPrograma(programId, body)
      else await criarPrograma(body)
      navigate(editProfilePath, { replace: true, state: { message: programId ? 'Programa atualizado.' : 'Programa salvo.' } })
    } catch (failure) {
      setError(failure.message || 'Não foi possível salvar o programa.')
    } finally {
      setSaving(false)
    }
  }

  if (screen.phase === 'loading') return <main className="training-program-page"><div className="training-program-page__container"><div className="training-program-status" role="status"><span className="training-program-spinner" /><span>Carregando programa…</span></div></div></main>
  if (screen.phase === 'error') return <main className="training-program-page"><div className="training-program-page__container"><Link className="training-program-back" to={editProfilePath}><ArrowLeft size={16} /> Voltar ao perfil</Link><div className="training-program-error" role="alert">{screen.error}</div></div></main>

  return <main className="training-program-page">
    <div className="training-program-page__container">
      <header className="training-program-header">
        <Link className="training-program-back" to={editProfilePath}><ArrowLeft size={16} /> Perfil de {screen.student.name}</Link>
        <div className="training-program-header__content">
          <div><p className="training-program-eyebrow">{programId ? 'EDIÇÃO DO PROGRAMA' : 'NOVO PROGRAMA'}</p><h1>{programId ? 'Editar programa' : 'Montar programa de treino'}</h1><p>Defina a prescrição e organize a sequência. As alterações só entram em vigor ao salvar.</p></div>
          <div className="training-program-student"><span><UserRound size={18} /></span><div><small>PARA ESTE ALUNO</small><strong>{screen.student.name}</strong></div></div>
        </div>
      </header>

      <form className="training-program-form" onSubmit={handleSave} noValidate aria-busy={saving}>
        <section className="training-program-section" aria-labelledby="program-details-title">
          <div className="training-program-section__heading"><div className="training-program-section__icon"><Dumbbell size={18} /></div><div><p>IDENTIFICAÇÃO</p><h2 id="program-details-title">Dados do programa</h2></div></div>
          <div className="training-program-fields">
            <div className="training-program-field"><label htmlFor="program-name">Nome do programa</label><input id="program-name" name="program-name" autoComplete="off" maxLength="100" value={draft.nome} onChange={(event) => { updateDraft({ nome: event.target.value }); setNameError('') }} placeholder="Ex.: Condicionamento — fase 1" disabled={saving} aria-invalid={Boolean(nameError)} aria-describedby={nameError ? 'program-name-error' : undefined} />{nameError && <span id="program-name-error" className="training-program-field__error">{nameError}</span>}</div>
            <div className="training-program-field training-program-icon-field"><label htmlFor="program-icon-url">Ícone do programa (URL)</label><input id="program-icon-url" name="iconeUrl" type="url" inputMode="url" autoCapitalize="none" spellCheck={false} placeholder="https://..." value={draft.iconeUrl || ''} onChange={(event) => updateDraft({ iconeUrl: event.target.value })} disabled={saving} /><span className="training-program-field__hint">Opcional. Informe um link direto para uma imagem.</span>{draft.iconeUrl && <img className="training-program-icon-preview" src={draft.iconeUrl} alt="Prévia do ícone do programa" onError={(event) => { event.currentTarget.hidden = true }} onLoad={(event) => { event.currentTarget.hidden = false }} />}</div>
            <div className="training-program-field"><label htmlFor="program-modality">Modalidade</label><select id="program-modality" value={draft.modalidadeId} onChange={(event) => updateDraft({ modalidadeId: event.target.value, atividades: [] })} disabled={saving || draft.atividades.length > 0}><option value="">Selecione uma modalidade</option>{screen.modalidades.map((modality) => <option key={modality.id} value={modality.id}>{modality.nome}</option>)}</select>{draft.atividades.length > 0 && <span className="training-program-field__hint">Remova as atividades antes de trocar a modalidade.</span>}</div>
          </div>
        </section>

        <section className="training-program-section" aria-labelledby="program-activities-title">
          <div className="training-program-section__heading"><div className="training-program-section__icon"><Check size={18} /></div><div><p>SEQUÊNCIA DO TREINO</p><h2 id="program-activities-title">Atividades <span className="training-program-count">{visibleActivities.length}</span></h2></div></div>
          {visibleActivities.length ? <ol className="training-program-activities">{visibleActivities.map((activity, index) => <SwipeDeleteCard as="li" key={activity.atividadeId}
            label={`Remover ${activity.nome || 'atividade'}`} disabled={saving} onRemove={() => removeActivity(activity)}>
            <div className="training-program-activity">
              <span className="training-program-activity__order">{String(index + 1).padStart(2, '0')}</span>
              <div className="training-program-activity__copy"><strong>{activity.nome || 'Atividade'}</strong><span>{activity.modalidadeId ? modalityNames.get(activity.modalidadeId) : ''}{activity.valores ? ` · ${Object.keys(activity.valores).length} parâmetros definidos` : ' · Sem parâmetros prescritos'}</span></div>
              <div className="training-program-activity__actions"><button type="button" aria-label={`Mover ${activity.nome} para cima`} title="Mover para cima" disabled={index === 0 || saving} onClick={() => moveActivity(index, -1)}><ArrowUp size={16} /></button><button type="button" aria-label={`Mover ${activity.nome} para baixo`} title="Mover para baixo" disabled={index === visibleActivities.length - 1 || saving} onClick={() => moveActivity(index, 1)}><ArrowDown size={16} /></button></div>
            </div>
          </SwipeDeleteCard>)}</ol> : <div className="training-program-empty"><span aria-hidden="true"><Dumbbell size={20} /></span><strong>Seu programa começa com uma atividade</strong><p>Escolha os exercícios e defina as metas para este aluno.</p></div>}
          <MorphPopover
            key={location.key}
            className="training-program-morph"
            label="Adicionar atividade"
            icon={<Plus size={16} aria-hidden="true" />}
            sentLabel="Atividade adicionada"
            initiallyConfirmed={Boolean(location.state?.addedActivityId && draft.atividades.some(
              (item) => item.atividadeId === location.state.addedActivityId,
            ))}
            disabled={!draft.modalidadeId || saving || waitingForUndo}
            panelContent={(close) => <>
              <p className="training-program-morph__copy">Escolha uma atividade de {modalityNames.get(draft.modalidadeId)} no catálogo e defina as metas.</p>
              <div className="training-program-morph__actions">
                <button type="button" className="training-program-morph__browse" disabled={saving || waitingForUndo} onClick={openActivityLibrary}>Abrir catálogo <ArrowRight size={15} aria-hidden="true" /></button>
                <button type="button" onClick={close}>Cancelar</button>
              </div>
            </>}
          />
          {!draft.modalidadeId && <p className="training-program-field__hint">Selecione uma modalidade para ver as atividades compatíveis.</p>}
        </section>

        {error && <p className="training-program-form-error" role="alert">{error}</p>}
        <footer className="training-program-footer"><span>{waitingForUndo ? 'Para salvar, aguarde o prazo ou desfaça a remoção.' : <><strong>{visibleActivities.length}</strong>{visibleActivities.length === 1 ? ' atividade adicionada' : ' atividades adicionadas'}</>}</span><button className="training-program-save" type="submit" disabled={saving || waitingForUndo}>{saving ? <><span className="training-program-save__spinner" aria-hidden="true" />Salvando…</> : <><Save size={17} />Salvar programa</>}</button></footer>
      </form>
    </div>
    <div inert={saving}>
      <Toaster toaster={toaster} className="deshi-action-toasts !fixed" />
    </div>
  </main>
}

export default TrainingProgramEditorPage
