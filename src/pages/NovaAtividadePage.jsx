import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import PageAppBar from '../components/PageAppBar'
import { useSession } from '../hooks/useSession'
import { useModalidadesCatalogo } from '../hooks/useModalidadesCatalogo'
import { criarAtividade } from '../services/atividades.service'

export default function NovaAtividadePage() {
  const { session } = useSession()
  const catalogo = useModalidadesCatalogo()
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [modalidadeId, setModalidadeId] = useState('')
  const [descricao, setDescricao] = useState('')
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const pending = useRef(null)

  useEffect(() => () => pending.current?.abort(), [])

  async function handleSubmit(event) {
    event.preventDefault()
    if (pending.current || catalogo.loading || catalogo.error || !catalogo.modalidades.length) return
    const nextErrors = {}
    if (!nome.trim()) nextErrors.nome = 'Informe o nome da atividade.'
    if (!catalogo.modalidades.some((item) => item.id === modalidadeId)) nextErrors.modalidadeId = 'Selecione uma modalidade.'
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
      await criarAtividade({ nome, modalidadeId, descricao }, controller.signal)
      if (!controller.signal.aborted) navigate('/atividades', { replace: true, state: { atividadeCriada: true } })
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure.message)
    } finally {
      pending.current = null
      if (!controller.signal.aborted) setSaving(false)
    }
  }

  return (
    <div className="app-shell">
      <AppHeader user={session.user} />
      <main className="activities-main">
        <PageAppBar title="Nova atividade" backTo="/atividades" backLabel="Voltar para a biblioteca" />
        <p className="activity-form-help">Crie uma atividade para sua biblioteca. * Campos obrigatórios.</p>
        <form className="activity-form" onSubmit={handleSubmit} noValidate aria-busy={saving}>
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
            <label htmlFor="activity-media">Imagem da atividade</label>
            <button id="activity-media" className="activity-media-button" type="button" disabled aria-describedby="activity-media-help">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8" cy="8" r="1.5" />
                <path d="m3 17 5-5 4 4 4-6 5 7" />
              </svg>
              Selecionar da galeria
            </button>
            <p className="activity-media-help" id="activity-media-help">Disponível em breve</p>
          </div>
          {error && <p className="feedback error" role="alert">{error}</p>}
          {saving && <p className="catalog-status" role="status">Criando atividade...</p>}
          <button className="primary-button" type="submit" disabled={saving || catalogo.loading || Boolean(catalogo.error) || !catalogo.modalidades.length}>{saving ? 'Criando...' : 'Criar atividade'}</button>
        </form>
      </main>
    </div>
  )
}
