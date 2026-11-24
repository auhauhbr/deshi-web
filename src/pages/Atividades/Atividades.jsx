import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import ProfessionalNavigation from '../../components/ProfessionalNavigation.jsx'
import ActivityListItem from '../../components/ActivityListItem.jsx'
import PageAppBar from '../../components/PageAppBar.jsx'
import { useModalidadesCatalogo } from '../../hooks/useModalidadesCatalogo.js'
import { listarAtividades } from '../../services/atividades.service.js'
import './Atividades.css'

export default function AtividadesPage() {
  const catalogo = useModalidadesCatalogo()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const programDraft = location.state?.programDraft ?? null
  const returnTo = location.state?.returnTo ?? ''
  const programContext = programDraft && returnTo ? { programDraft, returnTo, selectionPath: `${location.pathname}${location.search}` } : null
  const [created] = useState(Boolean(location.state?.atividadeCriada))
  const [busca, setBusca] = useState('')
  const [modalidadeId, setModalidadeId] = useState(programDraft?.modalidadeId || searchParams.get('modalidadeId') || '')
  const [grupoMuscular, setGrupoMuscular] = useState('')
  const [result, setResult] = useState({ key: null, atividades: [], error: '' })
  const [attempt, setAttempt] = useState(0)
  const requestKey = JSON.stringify([busca, modalidadeId, attempt])
  const loading = result.key !== requestKey
  const { atividades, error } = result
  const normalizarGrupo = (valor = '') => valor.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const gruposMusculares = [...new Map(atividades
    .map((atividade) => atividade.grupoMuscular?.trim())
    .filter(Boolean)
    .map((grupo) => [normalizarGrupo(grupo), grupo])).values()]
    .sort((first, second) => first[1].localeCompare(second[1], 'pt-BR'))
  const atividadesVisiveis = grupoMuscular
    ? atividades.filter((atividade) => normalizarGrupo(atividade.grupoMuscular) === normalizarGrupo(grupoMuscular))
    : atividades
  const nomeGrupo = (grupo) => ({
    abdomen: 'Abdômen', biceps: 'Bíceps', gluteos: 'Glúteos', triceps: 'Tríceps',
  })[normalizarGrupo(grupo)] || grupo

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
  const emptyMessage = grupoMuscular
    ? `Nenhuma atividade encontrada para o grupo ${nomeGrupo(grupoMuscular)} com os filtros selecionados.`
    : busca.trim() && modalidadeId
    ? 'Nenhuma atividade encontrada para esta busca nesta modalidade.'
    : busca.trim()
      ? 'Nenhuma atividade encontrada para esta busca.'
      : modalidadeId
        ? 'Nenhuma atividade disponível nesta modalidade.'
        : 'Nenhuma atividade disponível na biblioteca.'

  return (
    <div className="activities-page-shell">
      <ProfessionalNavigation />
      <main className="activities-main">
        {programContext ? <PageAppBar title="Adicionar atividade" backTo={returnTo} backLabel="Voltar ao programa" onBack={() => navigate(returnTo, { state: { programDraft } })} /> : <div className="activities-heading">
          <div>
            <span className="eyebrow">Biblioteca</span>
            <h1>Atividades</h1>
          </div>
          <Link className="secondary-button compact-button" to="/atividades/nova">+ Nova atividade</Link>
        </div>}
        {programContext && <p className="activities-context-note">Escolha uma atividade para <strong>{programDraft.nome || 'este programa'}</strong>. Você ainda poderá revisar tudo antes de salvar.</p>}
        {created && <p className="feedback success" role="status">Atividade criada com sucesso.</p>}
        <div className="activity-search field">
          <label className="visually-hidden" htmlFor="activity-search">Buscar atividade</label>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" />
          </svg>
          <input id="activity-search" type="search" placeholder="Buscar atividade..." value={busca} onChange={(event) => setBusca(event.target.value)} />
          {busca && <button type="button" className="search-clear" aria-label="Limpar busca" onClick={() => setBusca('')}>×</button>}
        </div>
        {!programContext && <div className="activity-filters" role="group" aria-label="Filtrar por modalidade">
          <button type="button" className="activity-chip" aria-pressed={!modalidadeId} onClick={() => setModalidadeId('')}><span className="activity-chip-label">Todos</span></button>
          {catalogo.modalidades.map((item) => (
            <button key={item.id} type="button" className="activity-chip" aria-pressed={modalidadeId === item.id} onClick={() => setModalidadeId(item.id)}><span className="activity-chip-label">{item.nome}</span></button>
          ))}
        </div>}
        <div className="activity-category-filter">
          <label htmlFor="activity-group-filter">Grupo muscular</label>
          <select id="activity-group-filter" value={grupoMuscular} onChange={(event) => setGrupoMuscular(event.target.value)} disabled={loading || gruposMusculares.length === 0}>
            <option value="">Todos os grupos</option>
            {gruposMusculares.map((grupo) => <option key={normalizarGrupo(grupo)} value={grupo}>{nomeGrupo(grupo)}</option>)}
          </select>
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
          ) : atividadesVisiveis.length === 0 ? (
            <div className="empty-state">
              <p role="status">{emptyMessage}</p>
              {busca.trim() || modalidadeId || grupoMuscular ? (
                <button className="secondary-button compact-button" type="button" onClick={() => { setBusca(''); setModalidadeId(''); setGrupoMuscular('') }}>Limpar filtros</button>
              ) : (
              <button className="secondary-button compact-button" type="button" onClick={() => setAttempt((value) => value + 1)}>Atualizar biblioteca</button>
              )}
            </div>
          ) : (
            <ul className="activity-list">
              {atividadesVisiveis.map((atividade) => (
                <ActivityListItem key={atividade.id} atividade={atividade} modalidade={nomesModalidades.get(atividade.modalidadeId) ?? (catalogo.loading ? 'Carregando modalidade...' : 'Modalidade indisponível')} programContext={programContext} alreadyAdded={Boolean(programContext && programDraft.atividades.some((item) => item.atividadeId === atividade.id))} returnTo={programContext ? returnTo : '/atividades'} />
              ))}
            </ul>
          )}
        </section>
        {!programContext && <Link className="app-navigation-row" to="/modalidades"><span>Minhas modalidades</span><span className="navigation-chevron" aria-hidden="true">›</span></Link>}
      </main>
    </div>
  )
}
