import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import ActivityListItem from '../components/ActivityListItem'
import { useSession } from '../hooks/useSession'
import { useModalidadesCatalogo } from '../hooks/useModalidadesCatalogo'
import { listarAtividades } from '../services/atividades.service'

export default function AtividadesPage() {
  const { session } = useSession()
  const catalogo = useModalidadesCatalogo()
  const location = useLocation()
  const navigate = useNavigate()
  const [created] = useState(Boolean(location.state?.atividadeCriada))
  const [busca, setBusca] = useState('')
  const [modalidadeId, setModalidadeId] = useState('')
  const [result, setResult] = useState({ key: null, atividades: [], error: '' })
  const [attempt, setAttempt] = useState(0)
  const requestKey = JSON.stringify([busca, modalidadeId, attempt, session.token])
  const loading = result.key !== requestKey
  const { atividades, error } = result

  useEffect(() => {
    if (location.state?.atividadeCriada) {
      navigate('/atividades', { replace: true, state: null })
    }
  }, [location.state, navigate])

  useEffect(() => {
    const controller = new AbortController()
    // Cleanup cancels both the debounce and any request for previous filters.
    const timeout = setTimeout(() => {
      listarAtividades({ busca, modalidadeId }, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) setResult({ key: requestKey, atividades: data, error: '' })
        })
        .catch((failure) => {
          if (!controller.signal.aborted) setResult({ key: requestKey, atividades: [], error: failure.message })
        })
    }, busca.trim() ? 300 : 0)
    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [busca, modalidadeId, requestKey])

  const nomesModalidades = new Map(catalogo.modalidades.map((item) => [item.id, item.nome]))
  const emptyMessage = busca.trim() && modalidadeId
    ? 'Nenhuma atividade encontrada para esta busca nesta modalidade.'
    : busca.trim()
      ? 'Nenhuma atividade encontrada para esta busca.'
      : modalidadeId
        ? 'Nenhuma atividade disponível nesta modalidade.'
        : 'Nenhuma atividade disponível na biblioteca.'

  return (
    <div className="app-shell">
      <AppHeader user={session.user} />
      <main className="activities-main">
        <div className="activities-heading">
          <div>
            <span className="eyebrow">Biblioteca</span>
            <h1>Atividades</h1>
          </div>
          <Link className="secondary-button compact-button" to="/atividades/nova">+ Nova atividade</Link>
        </div>
        {created && <p className="feedback success" role="status">Atividade criada com sucesso.</p>}
        <div className="activity-search field">
          <label className="visually-hidden" htmlFor="activity-search">Buscar atividade</label>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" />
          </svg>
          <input id="activity-search" type="search" placeholder="Buscar atividade..." value={busca} onChange={(event) => setBusca(event.target.value)} />
          {busca && <button type="button" className="search-clear" aria-label="Limpar busca" onClick={() => setBusca('')}>×</button>}
        </div>
        <div className="activity-filters" role="group" aria-label="Filtrar por modalidade">
          <button type="button" className="activity-chip" aria-pressed={!modalidadeId} onClick={() => setModalidadeId('')}>Todos</button>
          {catalogo.modalidades.map((item) => (
            <button key={item.id} type="button" className="activity-chip" aria-pressed={modalidadeId === item.id} onClick={() => setModalidadeId(item.id)}>{item.nome}</button>
          ))}
        </div>
        {catalogo.loading ? <p className="catalog-status" role="status">Carregando modalidades...</p> : catalogo.error ? (
          <div className="catalog-error">
            <p className="feedback error" role="alert">Não foi possível carregar as modalidades. {catalogo.error}</p>
            <button className="secondary-button compact-button" type="button" onClick={catalogo.retry}>Recarregar modalidades</button>
          </div>
        ) : catalogo.modalidades.length === 0 && <p className="catalog-status" role="status">Nenhuma modalidade disponível para filtrar.</p>}
        <section aria-label="Lista de atividades" aria-busy={loading}>
          {loading ? (
            <div className="empty-state" role="status"><span className="loading-dot" aria-hidden="true" />Carregando atividades...</div>
          ) : error ? (
            <div className="empty-state">
              <p className="feedback error" role="alert">{error}</p>
              <button className="secondary-button compact-button" type="button" onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</button>
            </div>
          ) : atividades.length === 0 ? (
            <div className="empty-state">
              <p role="status">{emptyMessage}</p>
              {busca.trim() || modalidadeId ? (
                <button className="secondary-button compact-button" type="button" onClick={() => { setBusca(''); setModalidadeId('') }}>Limpar filtros</button>
              ) : (
                <button className="secondary-button compact-button" type="button" onClick={() => setAttempt((value) => value + 1)}>Atualizar biblioteca</button>
              )}
            </div>
          ) : (
            <ul className="activity-list">
              {atividades.map((atividade) => (
                <ActivityListItem key={atividade.id} atividade={atividade} modalidade={nomesModalidades.get(atividade.modalidadeId) ?? (catalogo.loading ? 'Carregando modalidade...' : 'Modalidade indisponível')} />
              ))}
            </ul>
          )}
        </section>
        <Link className="activity-back-link" to="/modalidades">Minhas modalidades</Link>
      </main>
    </div>
  )
}
