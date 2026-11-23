import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ProfessionalNavigation from '../../components/ProfessionalNavigation.jsx'
import ActivityListItem from '../../components/ActivityListItem.jsx'
import { listarAtividades } from '../../services/atividades.service.js'
import { getMinhasModalidades } from '../../services/modalidades.service.js'
import '../Atividades/Atividades.css'
import './Biblioteca.css'

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
    getMinhasModalidades(controller.signal)
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
      listarAtividades({ busca: search, modalidadeId: modalityId }, controller.signal)
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
  const normalizeGroup = (value = '') => value.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const muscleGroups = [...new Map(availableActivities
    .map((item) => item.grupoMuscular?.trim())
    .filter(Boolean)
    .map((group) => [normalizeGroup(group), group])).values()]
    .sort((first, second) => first[1].localeCompare(second[1], 'pt-BR'))
  const groupLabel = (group) => ({
    abdomen: 'Abdômen', biceps: 'Bíceps', gluteos: 'Glúteos', triceps: 'Tríceps',
  })[normalizeGroup(group)] || group
  const visibleActivities = (onlyMine
    ? availableActivities.filter((item) => item.origem === 'PERSONALIZADA')
    : availableActivities).filter((item) => !muscleGroup || normalizeGroup(item.grupoMuscular) === normalizeGroup(muscleGroup))

  return (
    <div className="activities-page-shell library-page-shell">
      <ProfessionalNavigation />
      <main className="activities-main library-main">
        <header className="library-heading">
          <div>
            <span className="eyebrow">Seu catálogo de exercícios</span>
            <h1>Biblioteca</h1>
            <p>Atividades das modalidades que você ensina.</p>
          </div>
          <Link className="library-create-button" to="/atividades/nova" state={{ returnTo: '/biblioteca' }}>
            <span aria-hidden="true">＋</span> Criar atividade
          </Link>
        </header>

        {created && <p className="feedback success" role="status">Atividade criada e adicionada à sua biblioteca.</p>}

        <div className="activity-search field library-search">
          <label className="visually-hidden" htmlFor="library-search">Buscar atividade</label>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" />
          </svg>
          <input id="library-search" type="search" placeholder="Buscar exercício..." value={search} onChange={(event) => setSearch(event.target.value)} />
          {search && <button type="button" className="search-clear" aria-label="Limpar busca" onClick={() => setSearch('')}>×</button>}
        </div>

        <div className="library-controls">
          <div className="activity-filters library-modality-filters" role="group" aria-label="Filtrar por modalidade">
            <button type="button" className="activity-chip" aria-pressed={!modalityId} onClick={() => setModalityId('')}>Todas as modalidades</button>
            {modalities.data.map((modality) => (
              <button key={modality.id} type="button" className="activity-chip" aria-pressed={modalityId === modality.id} onClick={() => setModalityId(modality.id)}>{modality.nome}</button>
            ))}
          </div>
          <button type="button" className={`library-mine-filter${onlyMine ? ' is-active' : ''}`} aria-pressed={onlyMine} onClick={() => setOnlyMine((current) => !current)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20 7 10 17l-5-5" /></svg>
            Minhas atividades
          </button>
        </div>

        <div className="library-group-filter">
          <label htmlFor="library-group-filter">Grupo muscular</label>
          <select id="library-group-filter" value={muscleGroup} onChange={(event) => setMuscleGroup(event.target.value)} disabled={loading || muscleGroups.length === 0}>
            <option value="">Todos os grupos</option>
            {muscleGroups.map((group) => <option key={normalizeGroup(group)} value={group}>{groupLabel(group)}</option>)}
          </select>
        </div>

        {modalities.phase === 'loading' && <p className="catalog-status" role="status">Carregando suas modalidades...</p>}
        {modalities.phase === 'error' && <div className="empty-state"><p className="feedback error" role="alert">Não foi possível carregar suas modalidades. {modalities.error}</p><button className="secondary-button compact-button" type="button" onClick={() => { setModalities((current) => ({ ...current, phase: 'loading' })); setModalitiesAttempt((value) => value + 1) }}>Tentar novamente</button></div>}

        {modalities.phase === 'ready' && modalities.data.length === 0 ? (
          <div className="library-empty-state">
            <span className="library-empty-icon" aria-hidden="true">⌁</span>
            <h2>Escolha suas modalidades</h2>
            <p>Depois, você encontrará aqui os exercícios disponíveis para elas.</p>
            <Link className="secondary-button compact-button" to="/modalidades">Configurar modalidades</Link>
          </div>
        ) : modalities.phase === 'ready' && (
          <section className="library-results" aria-label="Exercícios disponíveis" aria-busy={loading}>
            <div className="library-results-heading"><h2>{onlyMine ? 'Minhas atividades' : 'Todos os exercícios'}</h2><span>{loading ? '…' : visibleActivities.length}</span></div>
            {loading ? <div className="empty-state" role="status"><span className="loading-dot" aria-hidden="true" />Carregando exercícios...</div>
              : activities.error ? <div className="empty-state"><p className="feedback error" role="alert">{activities.error}</p><button className="secondary-button compact-button" type="button" onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</button></div>
                : visibleActivities.length ? <ul className="activity-list">{visibleActivities.map((atividade) => <ActivityListItem key={atividade.id} atividade={atividade} modalidade={modalityNames.get(atividade.modalidadeId) || 'Modalidade'} returnTo="/biblioteca" />)}</ul>
                  : <div className="library-empty-state"><h2>{onlyMine ? 'Você ainda não criou atividades' : 'Nenhum exercício encontrado'}</h2><p>{onlyMine ? 'Crie uma atividade personalizada para adicioná-la à sua biblioteca.' : 'Tente outro termo de busca ou modalidade.'}</p>{onlyMine ? <Link className="secondary-button compact-button" to="/atividades/nova" state={{ returnTo: '/biblioteca' }}>Criar minha primeira atividade</Link> : <button className="secondary-button compact-button" type="button" onClick={() => { setSearch(''); setModalityId(''); setMuscleGroup('') }}>Limpar filtros</button>}</div>}
          </section>
        )}
      </main>
    </div>
  )
}
