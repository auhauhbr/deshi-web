import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import Snackbar from '../components/Snackbar'
import PageAppBar from '../components/PageAppBar'
import ActivityMedia from '../components/ActivityMedia'
import { useSession } from '../hooks/useSession'
import { useModalidadesCatalogo } from '../hooks/useModalidadesCatalogo'
import { listarAtividades } from '../services/atividades.service'
import { buscarCamposAtividade, definirCamposAtividade, criarConfiguracaoAtividade } from '../services/configuracoes-atividades.service'
import { METRICAS_ATIVIDADE, UNIDADES_ATIVIDADE, validarValoresAtividade } from '../utils/metricas-atividade'

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

function ValoresAtividade({ atividadeId, campos }) {
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
      await criarConfiguracaoAtividade(atividadeId, result.valores, controller.signal)
      if (!controller.signal.aborted) setFeedback({ type: 'success', message: 'Configuração salva' })
    } catch (failure) {
      if (!controller.signal.aborted) setFeedback({ type: 'error', message: failure.message })
    } finally {
      pending.current = null
      if (!controller.signal.aborted) setSaving(false)
    }
  }

  return (
    <form className="activity-form configuration-form" onSubmit={handleSubmit} noValidate aria-busy={saving}>
      <p className="activity-form-help">* Informações obrigatórias.</p>
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
      {feedback?.type === 'error' && <p className="feedback error" role="alert">{feedback.message}</p>}
      {saving && <p className="catalog-status" role="status">Salvando configuração...</p>}
      <button className="primary-button" type="submit" disabled={saving || feedback?.type === 'success'}>{saving ? 'Salvando...' : 'Salvar configuração'}</button>
      <Snackbar notification={feedback?.type === 'success' ? feedback : null} />
    </form>
  )
}

function CamposAtividade({ atividade }) {
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
      {state.phase === 'ready' && <ValoresAtividade atividadeId={atividade.id} campos={state.campos} />}
    </section>
  )
}

function ConfigurarAtividade({ atividadeId, user }) {
  const catalogo = useModalidadesCatalogo()
  const [state, setState] = useState({ phase: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    listarAtividades({}, controller.signal)
      .then((atividades) => {
        if (controller.signal.aborted) return
        const atividade = atividades.find((item) => item.id === atividadeId)
        setState(atividade ? { phase: 'ready', atividade } : { phase: 'not-found' })
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ phase: error.status === 404 ? 'not-found' : 'error', error: error.message })
      })
    return () => controller.abort()
  }, [atividadeId, attempt])

  return (
    <div className="app-shell">
      <AppHeader user={user} />
      <main className="activities-main">
        <PageAppBar title="Configurar atividade" backTo="/atividades" backLabel="Voltar para a biblioteca" />
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
            <ActivityMedia atividade={state.atividade} />
            <CamposAtividade atividade={state.atividade} />
          </>
        )}
      </main>
    </div>
  )
}

export default function ConfigurarAtividadePage() {
  const { id } = useParams()
  const { session } = useSession()
  // Reset local form state and abort pending work when the route or session changes.
  return <ConfigurarAtividade key={`${id}:${session.token}`} atividadeId={id} user={session.user} />
}
