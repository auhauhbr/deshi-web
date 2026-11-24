import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import ProfessionalNavigation from '../../components/ProfessionalNavigation.jsx'
import PageAppBar from '../../components/PageAppBar.jsx'
import { useModalidadesCatalogo } from '../../hooks/useModalidadesCatalogo.js'
import { atualizarAtividade, criarAtividade, listarAtividades } from '../../services/atividades.service.js'
import './NovaAtividade.css'

export default function NovaAtividadePage() {
  const catalogo = useModalidadesCatalogo()
  const location = useLocation()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const returnTo = location.state?.returnTo || '/atividades'
  const [editLoading, setEditLoading] = useState(isEditing)
  const [nome, setNome] = useState('')
  const [modalidadeId, setModalidadeId] = useState('')
  const [descricao, setDescricao] = useState('')
  const [midiaUrl, setMidiaUrl] = useState('')
  const [grupoMuscular, setGrupoMuscular] = useState('')
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const pending = useRef(null)

  useEffect(() => {
    if (!id) return undefined
    const controller = new AbortController()
    listarAtividades({}, controller.signal)
      .then((activities) => {
        if (controller.signal.aborted) return
        const activity = activities.find((item) => item.id === id && item.origem === 'PERSONALIZADA')
        if (!activity) {
          setError('Essa atividade personalizada não está disponível para edição.')
          return
        }
        setNome(activity.nome)
        setModalidadeId(activity.modalidadeId)
        setDescricao(activity.descricao || '')
        setMidiaUrl(activity.midiaUrl || '')
        setGrupoMuscular(activity.grupoMuscular || '')
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setEditLoading(false)
      })
    return () => controller.abort()
  }, [id])

  useEffect(() => () => pending.current?.abort(), [])

  async function handleSubmit(event) {
    event.preventDefault()
    if (pending.current || catalogo.loading || catalogo.error || !catalogo.modalidades.length) return
    const nextErrors = {}
    if (!nome.trim()) nextErrors.nome = 'Informe o nome da atividade.'
    if (!catalogo.modalidades.some((item) => item.id === modalidadeId)) nextErrors.modalidadeId = 'Selecione uma modalidade.'
    if (midiaUrl.trim()) {
      try {
        const url = new URL(midiaUrl.trim())
        if (!/^https?:\/\//i.test(midiaUrl.trim()) || !['http:', 'https:'].includes(url.protocol)) throw new Error()
      } catch {
        nextErrors.midiaUrl = 'Informe uma URL válida começando com http:// ou https://.'
      }
    }
    setErrors(nextErrors)
    setError('')
    if (Object.keys(nextErrors).length) {
      event.currentTarget.elements.namedItem(Object.keys(nextErrors)[0])?.focus()
      return
    }
    const controller = new AbortController()
    pending.current = controller
    setSaving(true)
    try {
      const activity = isEditing
        ? await atualizarAtividade(id, { nome, modalidadeId, descricao, midiaUrl, grupoMuscular }, controller.signal)
        : await criarAtividade({ nome, modalidadeId, descricao, midiaUrl, grupoMuscular }, controller.signal)
      if (!controller.signal.aborted) navigate(returnTo, { replace: true, state: isEditing ? { atividade: activity, returnTo: '/biblioteca' } : { atividadeCriada: true } })
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure.message)
    } finally {
      pending.current = null
      if (!controller.signal.aborted) setSaving(false)
    }
  }

  return (
    <main className="new-activity-page">
      <ProfessionalNavigation />
      <div className="new-activity-page__container">
        <PageAppBar title={isEditing ? 'Editar atividade' : 'Nova atividade'} backTo={returnTo} backLabel="Voltar para a biblioteca" />
        <p className="activity-form-help">{isEditing ? 'Atualize os dados da sua atividade personalizada.' : 'Crie uma atividade para sua biblioteca.'} * Campos obrigatórios.</p>
        {editLoading ? <p className="catalog-status" role="status">Carregando atividade...</p> : <form className="activity-form" onSubmit={handleSubmit} noValidate aria-busy={saving}>
          <div className="field">
            <label htmlFor="activity-name">Nome *</label>
            <input id="activity-name" name="nome" required value={nome} onChange={(event) => setNome(event.target.value)} disabled={saving} aria-invalid={Boolean(errors.nome)} aria-describedby={errors.nome ? 'name-error' : undefined} />
            {errors.nome && <p className="field-error" id="name-error" role="alert">{errors.nome}</p>}
          </div>
          <div className="field">
            <label htmlFor="activity-modality">Modalidade *</label>
            <select id="activity-modality" name="modalidadeId" required value={modalidadeId} onChange={(event) => setModalidadeId(event.target.value)} disabled={saving || catalogo.loading || Boolean(catalogo.error) || !catalogo.modalidades.length} aria-invalid={Boolean(errors.modalidadeId)} aria-describedby={errors.modalidadeId ? 'modality-error' : undefined}>
              <option value="">Selecione uma modalidade</option>
              {catalogo.modalidades.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
            </select>
            {errors.modalidadeId && <p className="field-error" id="modality-error" role="alert">{errors.modalidadeId}</p>}
            {catalogo.loading ? <p className="catalog-status" role="status">Carregando modalidades...</p> : catalogo.error ? (
              <div className="catalog-error">
                <p className="feedback error" role="alert">Não foi possível carregar as modalidades. {catalogo.error}</p>
                <button className="secondary-button compact-button" type="button" onClick={catalogo.retry}>Recarregar modalidades</button>
              </div>
            ) : catalogo.modalidades.length === 0 && (
              <div className="catalog-error">
                <p className="catalog-status" role="status">Nenhuma modalidade disponível. Aguarde o catálogo para criar uma atividade.</p>
                <button className="secondary-button compact-button" type="button" onClick={catalogo.retry}>Atualizar modalidades</button>
              </div>
            )}
          </div>
          <div className="field">
            <label htmlFor="activity-description">Descrição</label>
            <textarea id="activity-description" name="descricao" rows="3" value={descricao} onChange={(event) => setDescricao(event.target.value)} disabled={saving} />
          </div>
          <div className="field">
            <label htmlFor="activity-muscle-group">Grupo muscular</label>
            <select id="activity-muscle-group" name="grupoMuscular" value={grupoMuscular} onChange={(event) => setGrupoMuscular(event.target.value)} disabled={saving}>
              <option value="">Não informado</option>
              {['Peitoral', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Glúteos', 'Quadríceps', 'Posteriores de coxa', 'Panturrilhas', 'Corpo inteiro'].map((group) => <option key={group} value={group}>{group}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="activity-media">Link de imagem, GIF ou vídeo</label>
            <input id="activity-media" name="midiaUrl" type="url" inputMode="url" autoCapitalize="none" spellCheck={false} placeholder="https://" value={midiaUrl} onChange={(event) => setMidiaUrl(event.target.value)} disabled={saving} aria-invalid={Boolean(errors.midiaUrl)} aria-describedby={errors.midiaUrl ? 'media-error' : 'media-help'} />
            <p className="catalog-status" id="media-help">Use um link direto para o arquivo de mídia.</p>
            {errors.midiaUrl && <p className="field-error" id="media-error" role="alert">{errors.midiaUrl}</p>}
          </div>
          {error && <p className="feedback error" role="alert">{error}</p>}
          {saving && <p className="catalog-status" role="status">{isEditing ? 'Salvando alterações...' : 'Criando atividade...'}</p>}
          <button className="primary-button" type="submit" disabled={saving || catalogo.loading || Boolean(catalogo.error) || !catalogo.modalidades.length}>{saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar atividade'}</button>
        </form>}
        {error && !editLoading && !saving && !nome && <p className="feedback error" role="alert">{error}</p>}
      </div>
    </main>
  )
}
