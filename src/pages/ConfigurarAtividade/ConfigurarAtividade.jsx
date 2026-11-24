import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import ProfessionalNavigation from '../../components/ProfessionalNavigation.jsx'
import PageAppBar from '../../components/PageAppBar.jsx'
import { useModalidadesCatalogo } from '../../hooks/useModalidadesCatalogo.js'
import { listarAtividades } from '../../services/atividades.service.js'
import { buscarCamposAtividade, definirCamposAtividade, criarConfiguracaoAtividade } from '../../services/configuracoes-atividades.service.js'
import { METRICAS_ATIVIDADE, UNIDADES_ATIVIDADE, validarValoresAtividade } from '../../utils/metricas-atividade.js'
import './ConfigurarAtividade.css'

const SEM_DEFINICAO = 'Defina os campos da atividade antes de configurá-la.'

function DefinirInformacoes({ atividadeId, onDefined }) {
  const [selected, setSelected] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(null)
  useEffect(() => () => pending.current?.abort(), [])

  async function handleSubmit(event) {
    event.preventDefault()
    if (pending.current) return
    const campos = Object.entries(selected).map(([chave, obrigatorio]) => {
      const { tipo, unidade, min } = METRICAS_ATIVIDADE[chave]
      return { chave, tipo, unidade, min, obrigatorio }
    })
    if (!campos.length) {
      setError('Escolha pelo menos uma informação para a atividade.')
      event.currentTarget.querySelector('input')?.focus()
      return
    }
    const controller = new AbortController()
    pending.current = controller
    setSaving(true)
    setError('')
    try {
      await definirCamposAtividade(atividadeId, campos, controller.signal)
      if (!controller.signal.aborted) onDefined()
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure.message)
    } finally {
      pending.current = null
      if (!controller.signal.aborted) setSaving(false)
    }
  }

  return (
    <form className="definition-form" onSubmit={handleSubmit} aria-busy={saving}>
      <fieldset className="metric-options" disabled={saving} aria-describedby="definition-help">
        <legend>Definir informações da atividade</legend>
        <p id="definition-help" className="activity-form-help">Escolha o que deseja informar e o que será obrigatório. Depois de salvar, essa escolha não poderá ser editada.</p>
        {Object.entries(METRICAS_ATIVIDADE).map(([chave, metrica]) => (
          <div className="metric-option" key={chave}>
            <label htmlFor={`choose-${chave}`}>
              <input id={`choose-${chave}`} type="checkbox" checked={Object.hasOwn(selected, chave)} onChange={(event) => {
                const checked = event.target.checked
                setSelected((current) => {
                  const next = { ...current }
                  if (checked) next[chave] = false
                  else delete next[chave]
                  return next
                })
                setError('')
              }} />
              {metrica.label}
            </label>
            {Object.hasOwn(selected, chave) && (
              <label className="metric-required" htmlFor={`required-${chave}`}>
                <input id={`required-${chave}`} type="checkbox" checked={selected[chave]} aria-label={`${metrica.label}: obrigatório`} onChange={(event) => setSelected((current) => ({ ...current, [chave]: event.target.checked }))} />
                Obrigatório
              </label>
            )}
          </div>
        ))}
      </fieldset>
      {error && <p className="feedback error" role="alert">{error}</p>}
      {saving && <p className="catalog-status" role="status">Salvando informações...</p>}
      <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar informações'}</button>
    </form>
  )
}

function ValoresAtividade({ atividade, campos, programContext, onProgramConfigured }) {
  const atividadeId = atividade.id
  const [entradas, setEntradas] = useState({})
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [saving, setSaving] = useState(false)
  const pending = useRef(null)
  useEffect(() => () => pending.current?.abort(), [])

  async function handleSubmit(event) {
    event.preventDefault()
    if (pending.current || feedback?.type === 'success') return
    const result = validarValoresAtividade(campos, entradas, event.currentTarget)
    setErrors(result.errors)
    setFeedback(null)
    const firstError = Object.keys(result.errors)[0]
    if (firstError) {
      event.currentTarget.elements.namedItem(firstError)?.focus()
      return
    }
    const controller = new AbortController()
    pending.current = controller
    setSaving(true)
    try {
      if (programContext) {
        if (!controller.signal.aborted) onProgramConfigured({ ...atividade, valores: result.valores })
      } else {
        await criarConfiguracaoAtividade(atividadeId, result.valores, controller.signal)
        if (!controller.signal.aborted) setFeedback({ type: 'success', message: 'Configuração padrão salva com sucesso.' })
      }
    } catch (failure) {
      if (!controller.signal.aborted) setFeedback({ type: 'error', message: failure.message })
    } finally {
      pending.current = null
      if (!controller.signal.aborted) setSaving(false)
    }
  }

  return (
    <form className="activity-form configuration-form" onSubmit={handleSubmit} noValidate aria-busy={saving}>
      <p className="activity-form-help">{programContext ? 'Defina as metas desta atividade neste programa. * Informações obrigatórias.' : 'Defina os valores padrão que poderão ser usados nos próximos programas. * Informações obrigatórias.'}</p>
      {campos.map(({ chave, tipo, obrigatorio, unidade, min, max }) => (
        <div className="field" key={chave}>
          <div className="metric-label">
            <label htmlFor={`value-${chave}`}>{METRICAS_ATIVIDADE[chave].label}{obrigatorio ? ' *' : ''}</label>
            {!obrigatorio && <span id={`optional-${chave}`}>Opcional</span>}
          </div>
          <div className="metric-input">
            <input id={`value-${chave}`} name={chave} type="number" inputMode={tipo === 'decimal' ? 'decimal' : 'numeric'} step={tipo === 'decimal' ? 'any' : '1'} min={min} max={max} required={obrigatorio} value={entradas[chave] ?? ''} disabled={saving} aria-invalid={Boolean(errors[chave])} aria-describedby={[`unit-${chave}`, !obrigatorio && `optional-${chave}`, errors[chave] && `error-${chave}`].filter(Boolean).join(' ')} onChange={(event) => {
              setEntradas((current) => ({ ...current, [chave]: event.target.value }))
              setErrors((current) => ({ ...current, [chave]: '' }))
              setFeedback(null)
            }} />
            <span id={`unit-${chave}`}>{UNIDADES_ATIVIDADE[unidade]}</span>
          </div>
          {errors[chave] && <p id={`error-${chave}`} className="field-error" role="alert">{errors[chave]}</p>}
        </div>
      ))}
      {feedback && <p className={`feedback ${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.message}</p>}
      {saving && <p className="catalog-status" role="status">Salvando configuração...</p>}
      <button className="primary-button" type="submit" disabled={saving || feedback?.type === 'success'}>{saving ? 'Salvando...' : 'Salvar configuração'}</button>
    </form>
  )
}

function CamposAtividade({ atividade, programContext, onProgramConfigured }) {
  const [state, setState] = useState({ phase: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const region = useRef(null)
  const focusAfterDefinition = useRef(false)

  useEffect(() => {
    const controller = new AbortController()
    buscarCamposAtividade(atividade.id, controller.signal)
      .then((campos) => {
        if (!controller.signal.aborted) setState({ phase: 'ready', campos })
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        if (error.status === 409 && error.message.trim() === SEM_DEFINICAO && atividade.origem === 'PERSONALIZADA') {
          setState({ phase: 'define' })
        } else setState({ phase: error.status === 404 ? 'not-found' : 'error', error: error.message })
      })
    return () => controller.abort()
  }, [atividade.id, atividade.origem, attempt])

  useEffect(() => {
    if (state.phase === 'ready' && focusAfterDefinition.current) {
      region.current?.querySelector('input')?.focus()
      focusAfterDefinition.current = false
    }
  }, [state.phase])

  function reload() {
    setState({ phase: 'loading' })
    setAttempt((value) => value + 1)
  }

  return (
    <section ref={region} aria-label="Informações da atividade" aria-busy={state.phase === 'loading'}>
      {state.phase === 'loading' && <div className="empty-state" role="status"><span className="loading-dot" aria-hidden="true" />Carregando campos...</div>}
      {state.phase === 'not-found' && <p className="feedback error" role="alert">Atividade não encontrada.</p>}
      {state.phase === 'error' && <div className="empty-state"><p className="feedback error" role="alert">{state.error}</p><button className="secondary-button compact-button" type="button" onClick={reload}>Tentar novamente</button></div>}
      {state.phase === 'define' && <DefinirInformacoes atividadeId={atividade.id} onDefined={() => { focusAfterDefinition.current = true; reload() }} />}
      {state.phase === 'ready' && <ValoresAtividade atividade={atividade} campos={state.campos} programContext={programContext} onProgramConfigured={onProgramConfigured} />}
    </section>
  )
}

function ConfigurarAtividade({ atividadeId, programContext, returnTo }) {
  const catalogo = useModalidadesCatalogo()
  const navigate = useNavigate()
  const [state, setState] = useState({ phase: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const programModalidadeId = programContext?.programDraft?.modalidadeId

  useEffect(() => {
    const controller = new AbortController()
    listarAtividades({}, controller.signal)
      .then((atividades) => {
        if (controller.signal.aborted) return
        const atividade = atividades.find((item) => item.id === atividadeId)
        if (!atividade) setState({ phase: 'not-found' })
        else if (programModalidadeId && atividade.modalidadeId !== programModalidadeId) setState({ phase: 'error', error: 'Esta atividade pertence a outra modalidade e não pode entrar neste programa.' })
        else setState({ phase: 'ready', atividade })
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ phase: error.status === 404 ? 'not-found' : 'error', error: error.message })
      })
    return () => controller.abort()
  }, [atividadeId, attempt, programModalidadeId])

  function finishProgramConfiguration(atividade) {
    const { programDraft, returnTo } = programContext
    const activities = [...programDraft.atividades, {
      ...atividade,
      atividadeId: atividade.id,
      ordem: programDraft.atividades.length + 1,
    }]
    navigate(returnTo, { replace: true, state: { programDraft: { ...programDraft, atividades: activities } } })
  }

  const selectionPath = programContext?.selectionPath
  const handleBack = programContext && selectionPath
    ? () => navigate(selectionPath, { state: { programDraft: programContext.programDraft, returnTo: programContext.returnTo } })
    : undefined

  return (
    <main className="configure-activity-page">
      <ProfessionalNavigation />
      <div className="configure-activity-page__container">
        <PageAppBar title={programContext ? 'Metas da atividade' : 'Configurar atividade'} backTo={programContext ? '/atividades' : returnTo} backLabel={programContext ? 'Voltar à seleção' : 'Voltar para a biblioteca'} onBack={handleBack} />
        {programContext && <p className="configure-activity-context">Defina os valores prescritos para <strong>{programContext.programDraft.nome || 'este programa'}</strong>. O programa continua como rascunho até você salvá-lo.</p>}
        {state.phase === 'loading' && <div className="empty-state" role="status"><span className="loading-dot" aria-hidden="true" />Carregando atividade...</div>}
        {state.phase === 'not-found' && <p className="feedback error" role="alert">Atividade não encontrada.</p>}
        {state.phase === 'error' && <div className="empty-state"><p className="feedback error" role="alert">{state.error}</p><button className="secondary-button compact-button" type="button" onClick={() => { setState({ phase: 'loading' }); setAttempt((value) => value + 1) }}>Tentar novamente</button></div>}
        {state.phase === 'ready' && (
          <>
            <div className="configuration-heading">
              <h2>{state.atividade.nome}</h2>
              <p>{catalogo.modalidades.find((item) => item.id === state.atividade.modalidadeId)?.nome ?? (catalogo.loading ? 'Carregando modalidade...' : 'Modalidade indisponível')}</p>
            </div>
            {catalogo.error && <div className="catalog-error"><p className="feedback error" role="alert">{catalogo.error}</p><button className="secondary-button compact-button" type="button" onClick={catalogo.retry}>Recarregar modalidades</button></div>}
            <CamposAtividade atividade={state.atividade} programContext={programContext} onProgramConfigured={finishProgramConfiguration} />
          </>
        )}
      </div>
    </main>
  )
}

export default function ConfigurarAtividadePage() {
  const { id } = useParams()
  const location = useLocation()
  const programDraft = location.state?.programDraft
  const programContext = programDraft && location.state?.returnTo
    ? { programDraft, returnTo: location.state.returnTo, selectionPath: location.state.selectionPath }
    : null
  if (!programContext) return <Navigate to="/biblioteca" replace />
  const returnTo = location.state?.returnTo || '/atividades'
  return <ConfigurarAtividade key={id} atividadeId={id} programContext={programContext} returnTo={returnTo} />
}
