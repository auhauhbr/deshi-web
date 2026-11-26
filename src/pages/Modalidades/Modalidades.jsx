import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/authService.js'
import { getMinhasModalidades, getModalidades, saveModalidades } from '../../services/modalidades.service.js'
import './Modalidades.css'

function ModalidadesPage() {
  const navigate = useNavigate()
  const [catalog, setCatalog] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [alreadyConfigured, setAlreadyConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const pending = useRef(false)

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      getModalidades(controller.signal),
      getMinhasModalidades(controller.signal),
    ]).then(([available, mine]) => {
      if (controller.signal.aborted) return
      setCatalog(available)
      setSelected(new Set(mine.map((item) => item.id)))
      setAlreadyConfigured(mine.length > 0)
    }).catch((error) => {
      if (!controller.signal.aborted) setLoadError(getApiErrorMessage(error, 'Não foi possível carregar as modalidades.'))
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [attempt])

  function retryLoad() {
    setLoading(true)
    setLoadError('')
    setFeedback(null)
    setAttempt((value) => value + 1)
  }

  function toggle(id) {
    if (pending.current) return
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setFeedback(null)
  }

  async function handleSave() {
    if (pending.current) return
    if (selected.size === 0) {
      setFeedback({ type: 'error', message: 'Selecione pelo menos uma modalidade.' })
      return
    }
    pending.current = true
    setSaving(true)
    setFeedback(null)
    try {
      await saveModalidades([...selected])
      navigate('/home', { replace: true })
    } catch (error) {
      setFeedback({ type: 'error', message: getApiErrorMessage(error, 'Não foi possível salvar suas modalidades.') })
    } finally {
      pending.current = false
      setSaving(false)
    }
  }

  if (alreadyConfigured && !loading) return <Navigate to="/home" replace />

  return <main className="modalidades-page">
    <div className="modalidades-page__container">
      <header className="modalidades-page__header">
        <span className="modalidades-page__step">PRIMEIRO ACESSO <i aria-hidden="true">·</i> 01</span>
        <h1>Conte pra gente o que você ensina.</h1>
        <p>Escolha suas modalidades para organizarmos sua área profissional do seu jeito.</p>
      </header>

      <section className="modalidades-panel" aria-labelledby="modalidades-title" aria-describedby="modalidades-help" aria-busy={loading || saving}>
        <div className="modalidades-panel__heading">
          <div>
            <span className="modalidades-panel__eyebrow">SUA ÁREA DE ATUAÇÃO</span>
            <h2 id="modalidades-title">Quais modalidades você atende?</h2>
            <p id="modalidades-help">Selecione uma ou mais opções. Você poderá ajustar isso depois.</p>
          </div>
          {!loading && !loadError && catalog.length > 0 && <span className="modalidades-count" role="status">{selected.size} {selected.size === 1 ? 'selecionada' : 'selecionadas'}</span>}
        </div>

        {loading ? <div className="modalidades-state" role="status"><span className="modalidades-spinner" aria-hidden="true" />Carregando modalidades…</div> : loadError ? <div className="modalidades-state">
          <p className="modalidades-feedback modalidades-feedback--error" role="alert">{loadError}</p>
          <button className="modalidades-secondary-button" type="button" onClick={retryLoad}>Tentar novamente</button>
        </div> : catalog.length === 0 ? <div className="modalidades-state">
          <h3>Nenhuma modalidade disponível</h3><p>O catálogo está vazio no momento.</p>
          <button className="modalidades-secondary-button" type="button" onClick={retryLoad}>Atualizar catálogo</button>
        </div> : <>
          <div className="modalidades-grid" role="group" aria-labelledby="modalidades-title">
            {catalog.map((item) => {
              const isSelected = selected.has(item.id)
              return <button key={item.id} type="button" className={`modalidade-card${isSelected ? ' is-selected' : ''}`} aria-pressed={isSelected} disabled={saving} onClick={() => toggle(item.id)}>
                <span className="modalidade-card__mark" aria-hidden="true">{item.nome.trim().charAt(0).toLocaleUpperCase('pt-BR')}</span>
                <span className="modalidade-card__name">{item.nome}</span>
                <span className="modalidade-card__check" aria-hidden="true">{isSelected ? '✓' : '+'}</span>
              </button>
            })}
          </div>
          <div className="modalidades-panel__footer">
            <div className="modalidades-panel__feedback" aria-live="polite">
              {selected.size === 0 && !feedback && <p className="modalidades-hint">Escolha pelo menos uma modalidade para continuar.</p>}
              {feedback && <p className={`modalidades-feedback modalidades-feedback--${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.message}</p>}
            </div>
            <button className="modalidades-submit" type="button" onClick={handleSave} disabled={saving || selected.size === 0}>{saving ? <><span className="modalidades-spinner" aria-hidden="true" /> Salvando…</> : <>Salvar e continuar <span aria-hidden="true">→</span></>}</button>
          </div>
        </>}
      </section>
      <p className="modalidades-page__footnote">Sua seleção ajuda a preparar o espaço de trabalho. Os alunos e treinos vêm a seguir.</p>
    </div>
  </main>
}

export default ModalidadesPage
