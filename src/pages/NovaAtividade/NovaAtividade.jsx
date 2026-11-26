import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Dumbbell, ImagePlus } from 'lucide-react'
import PageAppBar from '../../components/PageAppBar.jsx'
import ExerciseMedia from '../../components/ExerciseMedia.jsx'
import Loader from '../../components/kokonutui/loader.jsx'
import { useModalidadesCatalogo } from '../../hooks/useModalidadesCatalogo.js'
import { atualizarAtividade, criarAtividade, listarAtividades } from '../../services/atividades.service.js'
import './NovaAtividade.css'

export default function NovaAtividadePage() {
  const catalogo = useModalidadesCatalogo({ skipGlobalLoading: true })
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
  const [previewUrl, setPreviewUrl] = useState('')
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const pending = useRef(null)

  useEffect(() => {
    if (!id) return undefined
    const controller = new AbortController()
    listarAtividades({}, controller.signal, { skipGlobalLoading: true })
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

  useEffect(() => {
    const candidate = midiaUrl.trim()
    if (!/^https?:\/\//i.test(candidate)) {
      setPreviewUrl('')
      return undefined
    }
    const timeout = setTimeout(() => setPreviewUrl(candidate), 350)
    return () => clearTimeout(timeout)
  }, [midiaUrl])

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
      <div className="new-activity-page__container">
        <PageAppBar title={isEditing ? 'Editar atividade' : 'Nova atividade'} backTo={returnTo} backLabel="Voltar para a biblioteca" />
        <div className="new-activity-intro"><h2>{isEditing ? 'Ajuste os detalhes do movimento' : 'Descreva o movimento'}</h2><p>Nome e modalidade identificam o exercício. Os demais dados ajudam a encontrá-lo e reconhecê-lo na biblioteca.</p></div>
        {editLoading ? <div className="new-activity-loading"><Loader size="sm" title="Carregando atividade" subtitle="Preparando os dados para edição" /></div> : <form className="new-activity-form" onSubmit={handleSubmit} noValidate aria-busy={saving}>
          <div className="new-activity-layout">
            <div className="new-activity-fields">
              <div className="field new-activity-field">
                <label htmlFor="activity-name">Nome <span className="new-activity-required">*</span></label>
                <input id="activity-name" name="nome" required placeholder="Ex.: Remada curvada" value={nome} onChange={(event) => setNome(event.target.value)} disabled={saving} aria-invalid={Boolean(errors.nome)} aria-describedby={errors.nome ? 'name-error' : undefined} />
                {errors.nome && <p className="field-error" id="name-error" role="alert">{errors.nome}</p>}
              </div>
              <div className="field new-activity-field">
                <label htmlFor="activity-modality">Modalidade <span className="new-activity-required">*</span></label>
                <select id="activity-modality" name="modalidadeId" required value={modalidadeId} onChange={(event) => setModalidadeId(event.target.value)} disabled={saving || catalogo.loading || Boolean(catalogo.error) || !catalogo.modalidades.length} aria-invalid={Boolean(errors.modalidadeId)} aria-describedby={errors.modalidadeId ? 'modality-error' : undefined}>
                  <option value="">Selecione uma modalidade</option>
                  {catalogo.modalidades.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                </select>
                {errors.modalidadeId && <p className="field-error" id="modality-error" role="alert">{errors.modalidadeId}</p>}
                {catalogo.loading ? <p className="catalog-status" role="status">Carregando modalidades...</p> : catalogo.error ? (
                  <div className="catalog-error"><p className="feedback error" role="alert">Não foi possível carregar as modalidades. {catalogo.error}</p><button className="secondary-button compact-button" type="button" onClick={catalogo.retry}>Recarregar modalidades</button></div>
                ) : catalogo.modalidades.length === 0 && (
                  <div className="catalog-error"><p className="catalog-status" role="status">Nenhuma modalidade disponível. Aguarde o catálogo para criar uma atividade.</p><button className="secondary-button compact-button" type="button" onClick={catalogo.retry}>Atualizar modalidades</button></div>
                )}
              </div>
              <div className="field new-activity-field new-activity-field--wide">
                <label htmlFor="activity-description">Descrição <span className="new-activity-optional">Opcional</span></label>
                <textarea id="activity-description" name="descricao" rows="3" placeholder="Pontos de atenção ou instruções para reconhecer o exercício." value={descricao} onChange={(event) => setDescricao(event.target.value)} disabled={saving} />
              </div>
              <div className="field new-activity-field">
                <label htmlFor="activity-muscle-group">Grupo muscular <span className="new-activity-optional">Opcional</span></label>
                <select id="activity-muscle-group" name="grupoMuscular" value={grupoMuscular} onChange={(event) => setGrupoMuscular(event.target.value)} disabled={saving}>
                  <option value="">Não informado</option>
                  {['Peitoral', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Glúteos', 'Quadríceps', 'Posteriores de coxa', 'Panturrilhas', 'Corpo inteiro'].map((group) => <option key={group} value={group}>{group}</option>)}
                </select>
              </div>
              <div className="field new-activity-field new-activity-field--wide">
                <label htmlFor="activity-media">Link de imagem, GIF ou vídeo <span className="new-activity-optional">Opcional</span></label>
                <input id="activity-media" name="midiaUrl" type="url" inputMode="url" autoCapitalize="none" spellCheck={false} placeholder="https://endereco-do-arquivo" value={midiaUrl} onChange={(event) => setMidiaUrl(event.target.value)} disabled={saving} aria-invalid={Boolean(errors.midiaUrl)} aria-describedby={errors.midiaUrl ? 'media-error media-help' : 'media-help'} />
                <p className="catalog-status" id="media-help">A prévia aparece depois que você parar de digitar o link.</p>
                {errors.midiaUrl && <p className="field-error" id="media-error" role="alert">{errors.midiaUrl}</p>}
              </div>
            </div>

            <aside className="new-activity-preview" aria-label="Prévia da mídia">
              <div className="new-activity-preview__heading"><div><h3>Demonstração</h3><p>Imagem, GIF ou vídeo do movimento.</p></div><span>{previewUrl ? 'Prévia' : 'Opcional'}</span></div>
              <div className="new-activity-preview__frame" aria-live="polite">
                {previewUrl
                  ? <ExerciseMedia key={previewUrl} src={previewUrl} alt={nome.trim() ? `Demonstração de ${nome}` : 'Prévia da atividade'} preview autoPlay loop controls={false} interactive={false} className="new-activity-preview__media" fallback={<div className="new-activity-preview__empty is-error"><ImagePlus size={25} aria-hidden="true" /><strong>Não foi possível abrir este link</strong><span>Use o endereço direto do arquivo de mídia.</span></div>} />
                  : <div className="new-activity-preview__empty"><ImagePlus size={25} aria-hidden="true" /><strong>Adicione uma mídia</strong><span>A prévia será exibida aqui.</span></div>}
              </div>
              <div className="new-activity-preview__note"><Dumbbell size={15} aria-hidden="true" /><span>GIFs e vídeos são reproduzidos em loop na visualização.</span></div>
            </aside>
          </div>
          {error && <p className="new-activity-error feedback error" role="alert">{error}</p>}
          {saving && <p className="new-activity-saving" role="status">{isEditing ? 'Salvando alterações...' : 'Criando atividade...'}</p>}
          <button className="primary-button new-activity-submit" type="submit" disabled={saving || catalogo.loading || Boolean(catalogo.error) || !catalogo.modalidades.length}><span>{saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar atividade'}</span>{!saving && <ArrowRight size={18} aria-hidden="true" />}</button>
        </form>}
      </div>
    </main>
  )
}
