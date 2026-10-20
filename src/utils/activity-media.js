import musculacao from '../assets/modalities/musculacao.png'
import supinoReto from '../assets/activities/supino-reto.gif'
import supinoRetoComHalteres from '../assets/activities/supino-reto-com-halteres.gif'

// Presentation assets keyed by the stable IDs of the existing catalog.
// These mappings do not change the activity data or the midiaUrl contract.
const activityMedia = new Map([
  ['a7101d90-8d5c-4ad3-9d68-000000000002', {
    src: supinoReto,
    alt: 'Demonstração de supino reto com barra',
    complementary: {
      src: supinoRetoComHalteres,
      alt: 'Demonstração de supino reto com halteres',
      caption: 'Variação com halteres',
    },
  }],
])

const modalityMedia = new Map([
  ['d1b10e90-8d5c-4ad3-9d68-000000000001', musculacao],
])

export function getActivityMedia(atividade) {
  const localMedia = atividade.origem === 'PADRAO' ? activityMedia.get(atividade.id) : null
  if (localMedia) return localMedia
  if (/^https?:\/\//i.test(atividade.midiaUrl ?? '')) {
    return { src: atividade.midiaUrl, alt: `Imagem de ${atividade.nome}` }
  }
  return null
}

export function getModalityMedia(modalidadeId) {
  return modalityMedia.get(modalidadeId) ?? null
}
