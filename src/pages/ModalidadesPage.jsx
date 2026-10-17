import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { useSession } from '../hooks/useSession'
import { getMinhasModalidades, getModalidades, saveModalidades } from '../services/modalidades.service'

export default function ModalidadesPage() {
  const { session } = useSession()
  const [catalog, setCatalog] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const pending = useRef(false)

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([getModalidades(controller.signal), getMinhasModalidades(controller.signal)])
      .then(([available, mine]) => {
        if (controller.signal.aborted) return
        setCatalog(available)
        setSelected(new Set(mine.map((item) => item.id)))
      })
      .catch((error) => {
        if (!controller.signal.aborted) setLoadError(error.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [attempt, session.token])

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
      const saved = await saveModalidades([...selected])
      setSelected(new Set(saved.map((item) => item.id)))
      setFeedback({ type: 'success', message: 'Modalidades salvas com sucesso.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    } finally {
      pending.current = false
      setSaving(false)
    }
  }

  return (
    <div className="app-shell">
      <AppHeader user={session.user} />
      <main className="modalidades-main">
        <div className="page-heading">
          <h1>Modalidades</h1>
        </div>
        <section className="panel selection-panel" aria-labelledby="selection-title" aria-busy={loading || saving}>
          <div className="selection-heading">
            <div>
              <h2 id="selection-title">Quais modalidades você atende?</h2>
              <p id="selection-help">Escolha uma ou mais opções.</p>
            </div>
            {!loading && !loadError && catalog.length > 0 && (
              <span className="count-pill" role="status">{selected.size} {selected.size === 1 ? 'selecionada' : 'selecionadas'}</span>
            )}
          </div>
          {loading ? (
            <div className="empty-state" role="status"><span className="loading-dot" aria-hidden="true" />Carregando modalidades...</div>
          ) : loadError ? (
            <div className="empty-state">
              <p className="feedback error" role="alert">{loadError}</p>
              <button className="secondary-button" type="button" onClick={retryLoad}>Tentar novamente</button>
            </div>
          ) : catalog.length === 0 ? (
            <div className="empty-state">
              <h3>Nenhuma modalidade disponível</h3>
              <p>O catálogo está vazio no momento. Tente novamente mais tarde.</p>
              <button className="secondary-button" type="button" onClick={retryLoad}>Atualizar catálogo</button>
            </div>
          ) : (
            <>
              <div className="modalidades-grid" role="group" aria-labelledby="selection-title" aria-describedby="selection-help">
                {catalog.map((item) => (
                  <button key={item.id} type="button" className="modalidade-card" aria-pressed={selected.has(item.id)} disabled={saving} onClick={() => toggle(item.id)}>
                    <span className="modalidade-name">{item.nome}</span>
                    <span className="selection-check" aria-hidden="true">{selected.has(item.id) ? '✓' : '+'}</span>
                  </button>
                ))}
              </div>
              <div className="save-area">
                <div className="save-feedback">
                  {selected.size === 0 && !feedback && <p className="selection-hint" role="status">Selecione pelo menos uma modalidade.</p>}
                  {feedback && <p className={`feedback ${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.message}</p>}
                </div>
                <button className="primary-button" type="button" onClick={handleSave} disabled={saving || selected.size === 0}>{saving ? 'Salvando...' : 'Salvar modalidades'}</button>
                <p className="save-note">Você pode alterar suas escolhas quando precisar.</p>
              </div>
            </>
          )}
        </section>
        <Link className="app-navigation-row" to="/atividades"><span>Biblioteca de atividades</span><span className="navigation-chevron" aria-hidden="true">›</span></Link>
      </main>
    </div>
  )
}
