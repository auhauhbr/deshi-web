import { Link, useParams } from 'react-router-dom'
import ProfessionalNavigation from '../../components/ProfessionalNavigation.jsx'
import './TrainingProgramEditor.css'

function TrainingProgramEditorPage() {
  const { studentId, programId } = useParams()
  const isEditing = Boolean(programId)
  const backTo = `/alunos/${studentId}`

  return <main className="program-editor-page">
    <ProfessionalNavigation />
    <div className="program-editor-page__content">
      <Link className="program-editor-page__back" to={backTo}><span aria-hidden="true">←</span> Voltar ao perfil</Link>
      <section className="program-editor-card" aria-labelledby="program-editor-title">
        <span className="program-editor-card__icon" aria-hidden="true">＋</span>
        <p className="program-editor-card__eyebrow">PROGRAMAS DE TREINO</p>
        <h1 id="program-editor-title">{isEditing ? 'Edição de treino' : 'Novo treino'}</h1>
        <p>Esta tela precisa ser implementada. Em breve você poderá {isEditing ? 'editar este programa e ajustar as atividades do aluno.' : 'montar um programa e escolher as atividades do aluno.'}</p>
        <Link className="program-editor-card__button" to={backTo}>Voltar ao perfil</Link>
      </section>
    </div>
  </main>
}

export default TrainingProgramEditorPage
