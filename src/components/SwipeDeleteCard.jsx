import { useEffect, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { animate, motion, useDragControls, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import './SwipeDeleteCard.css'

const buttonWidth = 44
const removalThreshold = 0.75

export default function SwipeDeleteCard({ as: Card = 'div', label, onRemove, disabled, children }) {
  const [width, setWidth] = useState(0)
  const [phase, setPhase] = useState('idle')
  const [removalError, setRemovalError] = useState('')
  const x = useMotionValue(0)
  const revealedWidth = useTransform(x, (value) => Math.max(0, -value))
  const background = useTransform(x, (value) => {
    const intensity = Math.min(1, 0.65 + Math.max(0, -value) / Math.max(1, width))
    return `color-mix(in srgb, #b42332 ${intensity * 100}%, var(--color-error-surface))`
  })
  const iconX = useTransform(x, (value) => Math.min(0, (buttonWidth + value) / 2))
  const iconColor = useTransform(x, (value) => {
    const intensity = Math.min(1, Math.max(0, (-value - buttonWidth / 2) / 10))
    return `color-mix(in srgb, #fff ${intensity * 100}%, var(--color-professional-muted))`
  })
  const reduceMotion = useReducedMotion()
  const dragControls = useDragControls()
  const cardRef = useRef(null)
  const actionRef = useRef(null)
  const dragged = useRef(false)
  const removalInFlight = useRef(false)
  const restoreFocus = useRef(false)

  useEffect(() => {
    const card = cardRef.current
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(card)
    return () => {
      observer.disconnect()
      x.stop()
      removalInFlight.current = false
    }
  }, [x])

  useEffect(() => {
    if (phase !== 'idle' || !restoreFocus.current) return
    restoreFocus.current = false
    actionRef.current?.focus({ preventScroll: true })
  }, [phase])

  function moveCard(target, transition) {
    x.stop()
    if (reduceMotion) {
      x.jump(target)
      return
    }
    return animate(x, target, transition)
  }

  function restoreCard() {
    moveCard(0, { type: 'spring', stiffness: 420, damping: 34 })
  }

  async function requestRemoval(exitWidth = 0) {
    if (disabled || removalInFlight.current) return
    removalInFlight.current = true
    restoreFocus.current = document.activeElement === actionRef.current
    setRemovalError('')
    setPhase('removing')

    try {
      if (exitWidth) {
        await moveCard(-exitWidth, { duration: 0.2, ease: 'easeOut' })
        if (!removalInFlight.current) return
        setPhase('exited')
      }
      await onRemove()
    } catch {
      if (removalInFlight.current) setRemovalError('Não foi possível remover o item. Tente novamente.')
    } finally {
      if (removalInFlight.current) {
        removalInFlight.current = false
        setPhase('idle')
        restoreCard()
      }
    }
  }

  return (
    <Card
      ref={cardRef}
      className="swipe-delete-card"
      data-swipe-phase={phase}
      style={{ '--swipe-action-space': `${buttonWidth}px` }}
      onPointerDown={(event) => {
        dragged.current = false
        if (disabled || removalInFlight.current || event.button !== 0) return
        const targetButton = event.target.closest('button')
        if (targetButton && targetButton !== actionRef.current) return
        x.stop()
        dragControls.start(event)
      }}
      onClickCapture={(event) => {
        if (!dragged.current || event.detail === 0) return
        event.preventDefault()
        event.stopPropagation()
        dragged.current = false
      }}
    >
      <motion.div className="swipe-delete-card__reveal" style={{ width: revealedWidth, backgroundColor: background }} aria-hidden="true" />
      <motion.div
        className="swipe-delete-card__content"
        style={{ x }}
        drag={disabled || phase !== 'idle' ? false : 'x'}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ left: -width, right: 0 }}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={() => { dragged.current = true }}
        onDragEnd={(event) => {
          dragged.current = true
          if (removalInFlight.current) return
          const cardWidth = cardRef.current?.clientWidth ?? 0
          const displacement = Math.max(0, -x.get())
          if (!disabled && event.type === 'pointerup' && cardWidth > 0 && displacement >= cardWidth * removalThreshold) {
            void requestRemoval(cardWidth)
          } else {
            restoreCard()
          }
        }}
      >
        {children}
        {removalError && <p className="swipe-delete-card__error" role="alert">{removalError}</p>}
      </motion.div>
      <motion.button
        ref={actionRef}
        type="button"
        className="swipe-delete-card__action"
        style={{ x: iconX, color: iconColor, width: buttonWidth }}
        aria-label={label}
        title={label}
        disabled={disabled || phase !== 'idle'}
        onClick={() => { void requestRemoval() }}
      >
        <Trash2 size={18} aria-hidden="true" />
      </motion.button>
    </Card>
  )
}
