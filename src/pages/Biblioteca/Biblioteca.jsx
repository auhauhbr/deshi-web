import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Check, Dumbbell, ListFilter, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import ProfessionalNavigation from '../../components/ProfessionalNavigation.jsx'
import ActivityListItem from '../../components/ActivityListItem.jsx'
import Loader from '../../components/kokonutui/loader.jsx'
import { listarAtividades } from '../../services/atividades.service.js'
import { getMinhasModalidades } from '../../services/modalidades.service.js'
import '../Atividades/Atividades.css'
import './Biblioteca.css'

function normalizeGroup(value = '') {
  return value.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function labelGroup(group) {
  return ({ abdomen: 'Abdômen', biceps: 'Bíceps', gluteos: 'Glúteos', triceps: 'Tríceps' })[normalizeGroup(group)] || group
}

export default function BibliotecaPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [modalities, setModalities] = useState({ phase: 'loading', data: [], error: '' })
  const [activities, setActivities] = useState({ key: null, data: [], error: '' })
  const [search, setSearch] = useState('')
  const [modalityId, setModalityId] = useState('')
  const [muscleGroup, setMuscleGroup] = useState('')
  const [onlyMine, setOnlyMine] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [modalitiesAttempt, setModalitiesAttempt] = useState(0)
  const [created] = useState(Boolean(location.state?.atividadeCriada))
  const requestKey = JSON.stringify([search.trim(), modalityId, attempt])
  const loading = activities.key !== requestKey

  useEffect(() => {
    const controller = new AbortController()
    getMinhasModalidades(controller.signal, { skipGlobalLoading: true })
      .then((data) => {
        if (!controller.signal.aborted) setModalities({ phase: 'ready', data, error: '' })
      })
      .catch((error) => {
        if (!controller.signal.aborted) setModalities({ phase: 'error', data: [], error: error.message })
      })
    return () => controller.abort()
  }, [modalitiesAttempt])

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      listarAtividades({ busca: search, modalidadeId: modalityId }, controller.signal, { skipGlobalLoading: true })
        .then((data) => {
          if (!controller.signal.aborted) setActivities({ key: requestKey, data, error: '' })
        })
        .catch((error) => {
          if (!controller.signal.aborted) setActivities({ key: requestKey, data: [], error: error.message })
        })
    }, search.trim() ? 250 : 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [search, modalityId, requestKey])

  useEffect(() => {
    if (location.state?.atividadeCriada) {
      navigate('/biblioteca', { replace: true, state: null })
    }
  }, [location.state, navigate])

  const modalityNames = useMemo(() => new Map(modalities.data.map((item) => [item.id, item.nome])), [modalities.data])
  const availableActivities = useMemo(() => {
    const modalityIds = new Set(modalities.data.map((item) => item.id))
    return activities.data.filter((item) => modalityIds.has(item.modalidadeId))
  }, [activities.data, modalities.data])
  const muscleGroups = useMemo(() => [...new Map(availableActivities
    .map((item) => item.grupoMuscular?.trim())
    .filter(Boolean)
    .map((group) => [normalizeGroup(group), group])).values()]
    .sort((first, second) => first.localeCompare(second, 'pt-BR')), [availableActivities])
  const visibleActivities = useMemo(() => availableActivities
    .filter((item) => (!onlyMine || item.origem === 'PERSONALIZADA') && (!muscleGroup || normalizeGroup(item.grupoMuscular) === normalizeGroup(muscleGroup))), [availableActivities, muscleGroup, onlyMine])
  const mineCount = useMemo(() => availableActivities.filter((item) => item.origem === 'PERSONALIZADA').length, [availableActivities])
  const activeFilters = Boolean(search.trim() || modalityId || muscleGroup || onlyMine)
  const clearFilters = () => { setSearch(''); setModalityId(''); setMuscleGroup(''); setOnlyMine(false) }

  return (
    <div className="activities-page-shell library-page-shell">
      <ProfessionalNavigation />
      <main className="activities-main library-main">
        <header className="library-heading">
          <div>
            <h1>Biblioteca de atividades</h1>
            <p>Exercícios disponíveis para as modalidades que você ensina.</p>
          </div>
          <Link className="library-create-button" to="/atividades/nova" state={{ returnTo: '/biblioteca' }}>
            <Plus size={18} aria-hidden="true" /> Criar atividade
          </Link>
        </header>

        {created && <p className="feedback success library-created" role="status"><Check size={17} aria-hidden="true" />Atividade criada e adicionada à sua biblioteca.</p>}

        <section className="library-explorer" aria-label="Buscar e filtrar atividades">
          <div className="activity-search field library-search">
            <label className="visually-hidden" htmlFor="library-search">Buscar atividade</label>
            <Search size={19} aria-hidden="true" />
            <input id="library-search" type="search" placeholder="Buscar por exercício..." value={search} onChange={(event) => setSearch(event.target.value)} />
            {search && <button type="button" className="search-clear" aria-label="Limpar busca" onClick={() => setSearch('')}><X size={16} /></button>}
          </div>

          <div className="library-filter-heading"><span><SlidersHorizontal size={15} aria-hidden="true" />Filtros</span>{activeFilters && <button type="button" onClick={clearFilters}>Limpar filtros <X size={14} aria-hidden="true" /></button>}</div>
          <div className="library-controls">
            <div className="library-modality-block">
              <span className="library-control-label">Modalidade</span>
              <div className="activity-filters library-modality-filters" role="group" aria-label="Filtrar por modalidade">
                <button type="button" className="activity-chip" aria-pressed={!modalityId} onClick={() => setModalityId('')}>Todas</button>
                {modalities.data.map((modality) => (
                  <button key={modality.id} type="button" className="activity-chip" aria-pressed={modalityId === modality.id} onClick={() => setModalityId(modality.id)}>{modality.nome}</button>
                ))}
              </div>
            </div>
            <div className="library-refinements">
              <div className="library-group-filter">
                <label htmlFor="library-group-filter"><ListFilter size={15} aria-hidden="true" />Grupo muscular</label>
                <select id="library-group-filter" value={muscleGroup} onChange={(event) => setMuscleGroup(event.target.value)} disabled={loading || muscleGroups.length === 0}>
                  <option value="">Todos</option>
                  {muscleGroups.map((group) => <option key={normalizeGroup(group)} value={group}>{labelGroup(group)}</option>)}
                </select>
              </div>
              <button type="button" className={`library-mine-filter${onlyMine ? ' is-active' : ''}`} aria-pressed={onlyMine} onClick={() => setOnlyMine((current) => !current)}>
                <Check size={15} aria-hidden="true" />Minhas <span>{mineCount}</span>
              </button>
            </div>
          </div>
        </section>

        {modalities.phase === 'loading' && <p className="catalog-status library-status" role="status">Carregando suas modalidades...</p>}
        {modalities.phase === 'error' && <div className="empty-state"><p className="feedback error" role="alert">Não foi possível carregar suas modalidades. {modalities.error}</p><button className="secondary-button compact-button" type="button" onClick={() => { setModalities((current) => ({ ...current, phase: 'loading' })); setModalitiesAttempt((value) => value + 1) }}>Tentar novamente</button></div>}

        {modalities.phase === 'ready' && modalities.data.length === 0 ? (
          <div className="library-empty-state library-empty-state--setup">
            <span className="library-empty-icon" aria-hidden="true"><Dumbbell size={20} /></span>
            <h2>Escolha suas modalidades</h2>
            <p>Depois, você encontrará aqui os exercícios disponíveis para elas.</p>
            <Link className="secondary-button compact-button" to="/modalidades">Configurar modalidades <span aria-hidden="true">→</span></Link>
          </div>
        ) : modalities.phase === 'ready' && (
          <section className="library-results" aria-label="Exercícios disponíveis" aria-busy={loading}>
            <div className="library-results-heading"><div><h2>{onlyMine ? 'Minhas atividades' : 'Exercícios'}</h2><p>{onlyMine ? 'Atividades personalizadas por você.' : 'Abra um exercício para ver execução e detalhes.'}</p></div><span>{loading ? '…' : visibleActivities.length}</span></div>
            {loading ? <div className="library-search-loading"><Loader size="sm" title={search.trim() ? 'Buscando exercícios' : 'Carregando biblioteca'} subtitle="Atualizando resultados" /></div>
              : activities.error ? <div className="empty-state"><p className="feedback error" role="alert">{activities.error}</p><button className="secondary-button compact-button" type="button" onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</button></div>
                : visibleActivities.length ? <ul className="activity-list library-activity-list">{visibleActivities.map((atividade) => <ActivityListItem key={atividade.id} atividade={atividade} modalidade={modalityNames.get(atividade.modalidadeId) || 'Modalidade'} returnTo="/biblioteca" detailPath={`/biblioteca/atividades/${encodeURIComponent(atividade.id)}`} showDetailsLabel />)}</ul>
                  : <div className="library-empty-state"><h2>{onlyMine ? 'Você ainda não criou atividades' : 'Nenhum exercício encontrado'}</h2><p>{onlyMine ? 'Crie uma atividade personalizada para adicioná-la à sua biblioteca.' : 'Tente outro termo de busca ou ajuste os filtros.'}</p>{onlyMine ? <Link className="secondary-button compact-button" to="/atividades/nova" state={{ returnTo: '/biblioteca' }}>Criar minha primeira atividade <span aria-hidden="true">→</span></Link> : <button className="secondary-button compact-button" type="button" onClick={clearFilters}>Limpar filtros</button>}</div>}
          </section>
        )}
      </main>
    </div>
  )
}
