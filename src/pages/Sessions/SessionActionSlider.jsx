import StudentButton from '../../components/StudentButton.jsx'
import './SessionActionSlider.css'

function SessionActionSlider({ status, busy, onAction }) {
  const isPaused = status === 'PAUSED'

  return (
    <div className="session-action-control" role="group" aria-label="Controles da sessão">
      <StudentButton variant="secondary" onClick={() => onAction('toggle')} busy={busy}>
        {busy ? 'Atualizando sessão...' : isPaused ? 'Retomar sessão' : 'Pausar sessão'}
      </StudentButton>
      <StudentButton variant="danger" onClick={() => onAction('interrupt')} disabled={busy}>
        Interromper
      </StudentButton>
      <StudentButton variant="primary" particles onClick={() => onAction('finish')} disabled={busy}>
        Finalizar sessão
      </StudentButton>
      <p className="session-action-instructions">
        A pausa interrompe o tempo ativo. O descanso da atividade continua separado.
      </p>
    </div>
  )
}

export default SessionActionSlider
