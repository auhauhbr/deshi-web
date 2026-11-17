import { useRef, useState } from 'react'
import './SessionActionSlider.css'

function ControlIcon({ kind }) {
  if (kind === 'finish') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7" /></svg>
  if (kind === 'interrupt') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="3" /></svg>
  if (kind === 'play') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7z" /></svg>
  if (kind === 'loading') return <span className="session-slider-spinner" aria-hidden="true" />
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" /></svg>
}

function SessionActionSlider({ status, busy, onAction }) {
  const trackRef = useRef(null)
  const dragStartRef = useRef(null)
  const offsetRef = useRef(0)
  const [offset, setOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  function getMaxTravel() {
    const trackWidth = trackRef.current?.getBoundingClientRect().width || 0
    const thumbWidth = trackRef.current?.querySelector('.session-slider-thumb')?.getBoundingClientRect().width || 0
    return Math.max(0, (trackWidth - thumbWidth) / 2 - 8)
  }

  async function finishSlide(value) {
    const maxTravel = getMaxTravel()
    if (!maxTravel || Math.abs(value) < maxTravel * .72) {
      offsetRef.current = 0
      setOffset(0)
      return
    }

    const result = await onAction(value < 0 ? 'interrupt' : 'finish')
    if (!result) {
      offsetRef.current = 0
      setOffset(0)
    }
  }

  function handlePointerDown(event) {
    if (busy) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragStartRef.current = { x: event.clientX, offset: offsetRef.current }
    setIsDragging(true)
  }

  function handlePointerMove(event) {
    if (!dragStartRef.current) return
    const travel = getMaxTravel()
    const next = Math.max(-travel, Math.min(travel, dragStartRef.current.offset + event.clientX - dragStartRef.current.x))
    offsetRef.current = next
    setOffset(next)
  }

  async function handlePointerUp(event) {
    const start = dragStartRef.current
    if (!start) return
    dragStartRef.current = null
    setIsDragging(false)

    const distance = event.clientX - start.x
    const travel = getMaxTravel()
    const value = Math.max(-travel, Math.min(travel, start.offset + distance))
    offsetRef.current = value
    setOffset(value)
    if (Math.abs(distance) < 8) {
      offsetRef.current = 0
      setOffset(0)
      await onAction('toggle')
      return
    }
    await finishSlide(value)
  }

  function handlePointerCancel() {
    dragStartRef.current = null
    offsetRef.current = 0
    setOffset(0)
    setIsDragging(false)
  }

  function handleKeyDown(event) {
    if (busy) return
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      onAction('interrupt')
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      onAction('finish')
    } else if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      onAction('toggle')
    }
  }

  const isPaused = status === 'PAUSED'
  const valuePercent = getMaxTravel() ? Math.round((offset / getMaxTravel()) * 100) : 0

  return (
    <div className="session-action-control">
      <div ref={trackRef} className={`session-action-slider${isDragging ? ' is-dragging' : ''}${isDragging && offset < -4 ? ' is-dragging-left' : ''}${isDragging && offset > 4 ? ' is-dragging-right' : ''}${busy ? ' is-busy' : ''}`}>
        <span className="session-slider-end session-slider-left"><ControlIcon kind="interrupt" /><span>Interromper</span></span>
        <span className="session-slider-end session-slider-right"><ControlIcon kind="finish" /><span>Finalizar</span></span>
        <button
          type="button"
          className="session-slider-thumb"
          style={{ transform: `translate(calc(-50% + ${offset}px), -50%)` }}
          role="slider"
          aria-label="Controle da sessão. Deslize para a esquerda para interromper, para a direita para finalizar, ou pressione espaço para pausar ou retomar."
          aria-valuemin={-100}
          aria-valuemax={100}
          aria-valuenow={valuePercent}
          aria-valuetext={isPaused ? 'Sessão pausada. Pressione espaço para retomar.' : 'Sessão em andamento. Pressione espaço para pausar.'}
          aria-disabled={busy}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onKeyDown={handleKeyDown}
          disabled={busy}
        >
          <ControlIcon kind={busy ? 'loading' : isPaused ? 'play' : 'pause'} />
        </button>
      </div>
        <p className="session-action-instructions">Deslize para interromper ou finalizar</p>
    </div>
  )
}

export default SessionActionSlider
