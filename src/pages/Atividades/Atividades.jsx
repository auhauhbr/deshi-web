import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Dumbbell, ListFilter, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import ProfessionalNavigation from '../../components/ProfessionalNavigation.jsx'
import ActivityListItem from '../../components/ActivityListItem.jsx'
import PageAppBar from '../../components/PageAppBar.jsx'
import FadeContent from '../../components/FadeContent.jsx'
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
            <span className="eyebrow">Biblioteca de atividades</span>
            <h1>Exercícios para sua prática</h1>
          </div>
          <Link className="secondary-button compact-button" to="/atividades/nova"><Plus size={16} /> Nova atividade</Link>
        </div>}
        {programContext && <>
          <section className="activity-program-context" aria-label="Programa em edição">
            <span className="activity-program-context__icon"><Dumbbell size={19} aria-hidden="true" /></span>
            <div className="activity-program-context__copy"><span>Adicionando ao programa</span><strong>{programDraft.nome || 'Novo programa'}</strong></div>
            <div className="activity-program-context__count"><strong>{programDraft.atividades.length}</strong><span>{programDraft.atividades.length === 1 ? 'atividade adicionada' : 'atividades adicionadas'}</span></div>
          </section>
          <div className="activity-browser-heading"><div><p>CATÁLOGO DE ATIVIDADES</p><h2>Encontre o próximo exercício</h2><span>Selecione um exercício para definir a prescrição deste programa.</span></div><ArrowRight size={20} aria-hidden="true" /></div>
        </>}
        {created && <p className="feedback success" role="status">Atividade criada com sucesso.</p>}
        <div className="activity-search field">
          <label className="visually-hidden" htmlFor="activity-search">Buscar atividade</label>
          <Search size={19} aria-hidden="true" />
          <input id="activity-search" type="search" placeholder="Buscar por nome do exercício..." value={busca} onChange={(event) => setBusca(event.target.value)} />
          {busca && <button type="button" className="search-clear" aria-label="Limpar busca" onClick={() => setBusca('')}><X size={16} /></button>}
        </div>
        <div className="activity-filter-bar">
        {!programContext && <div className="activity-filters" role="group" aria-label="Filtrar por modalidade">
          <span className="activity-filter-bar__label"><SlidersHorizontal size={15} aria-hidden="true" />Modalidade</span>
          <button type="button" className="activity-chip" aria-pressed={!modalidadeId} onClick={() => setModalidadeId('')}><span className="activity-chip-label">Todos</span></button>
          {catalogo.modalidades.map((item) => (
            <button key={item.id} type="button" className="activity-chip" aria-pressed={modalidadeId === item.id} onClick={() => setModalidadeId(item.id)}><span className="activity-chip-label">{item.nome}</span></button>
          ))}
        </div>}
        {programContext && <span className="activity-locked-modality"><Dumbbell size={14} />{catalogo.modalidades.find((item) => item.id === modalidadeId)?.nome || 'Modalidade do programa'}</span>}
        <div className="activity-category-filter">
          <label htmlFor="activity-group-filter"><ListFilter size={15} aria-hidden="true" />Grupo muscular</label>
          <select id="activity-group-filter" value={grupoMuscular} onChange={(event) => setGrupoMuscular(event.target.value)} disabled={loading || gruposMusculares.length === 0}>
            <option value="">Todos os grupos</option>
            {gruposMusculares.map((grupo) => <option key={normalizarGrupo(grupo)} value={grupo}>{nomeGrupo(grupo)}</option>)}
          </select>
        </div>
        </div>
        {catalogo.loading ? <p className="catalog-status" role="status">Carregando modalidades...</p> : catalogo.error ? (
          <div className="catalog-error">
            <p className="feedback error" role="alert">Não foi possível carregar as modalidades. {catalogo.error}</p>
            <button className="secondary-button compact-button" type="button" onClick={catalogo.retry}>Recarregar modalidades</button>
          </div>
        ) : catalogo.modalidades.length === 0 && <p className="catalog-status" role="status">Nenhuma modalidade disponível para filtrar.</p>}
        <section className="activity-results" aria-label="Lista de atividades" aria-busy={loading}>
          {!loading && !error && <div className="activity-results__heading"><span>{atividadesVisiveis.length} {atividadesVisiveis.length === 1 ? 'exercício encontrado' : 'exercícios encontrados'}</span>{grupoMuscular && <button type="button" onClick={() => setGrupoMuscular('')}>Limpar grupo <X size={14} /></button>}</div>}
          {loading ? (
            <div className="activity-loading-list" role="status" aria-label="Carregando atividades">{[0, 1, 2].map((item) => <div className="activity-loading-row" key={item}><span /><div><i /><b /></div><em /></div>)}</div>
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
            <FadeContent className="activity-results__enter" trigger="mount" duration={0.38} effect="focus" blur={3}>
              <ul className="activity-list">
                {atividadesVisiveis.map((atividade, index) => (
                  <ActivityListItem key={atividade.id} atividade={atividade} modalidade={nomesModalidades.get(atividade.modalidadeId) ?? (catalogo.loading ? 'Carregando modalidade...' : 'Modalidade indisponível')} programContext={programContext} alreadyAdded={Boolean(programContext && programDraft.atividades.some((item) => item.atividadeId === atividade.id))} returnTo={programContext ? returnTo : '/atividades'} style={{ '--activity-index': index }} />
                ))}
              </ul>
            </FadeContent>
          )}
        </section>
        {!programContext && <Link className="app-navigation-row" to="/modalidades"><span>Minhas modalidades</span><span className="navigation-chevron" aria-hidden="true">›</span></Link>}
      </main>
    </div>
  )
}
