import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { CheckCircle2 } from 'lucide-react'
import './SwipeToast.css'

function SwipeToast({
  open = true,
  onClose,
  title = 'Conta criada com sucesso',
  description = '',
  duration = 4500,
  background = '#10382d',
  color = '#f4fff9',
  fuseColor = '#00d9a0',
}) {
  const reduceMotion = useReducedMotion()
  const timer = useRef(null)
  const startedAt = useRef(0)
  const remaining = useRef(duration)
  const closeRequested = useRef(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    closeRequested.current = false
    remaining.current = duration
    return () => window.clearTimeout(timer.current)
  }, [duration, open])

  function requestClose(reason) {
    if (closeRequested.current) return
    closeRequested.current = true
    window.clearTimeout(timer.current)
    onClose?.(reason)
  }

  function startTimer() {
    if (!open || duration <= 0 || paused || closeRequested.current) return
    startedAt.current = Date.now()
    timer.current = window.setTimeout(() => requestClose('timeout'), remaining.current)
  }

  function pauseTimer() {
    if (!open || duration <= 0 || paused || closeRequested.current) return
    window.clearTimeout(timer.current)
    remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current))
    setPaused(true)
  }

  function resumeTimer() {
    if (!paused || closeRequested.current) return
    setPaused(false)
  }

  useEffect(() => {
    if (!open || duration <= 0 || paused) return undefined
    startTimer()
    return () => window.clearTimeout(timer.current)
  // Timer is intentionally armed when the toast opens or resumes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, duration, paused])

  useEffect(() => {
    if (!open) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') requestClose('escape')
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          className="swipe-toast"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          tabIndex={0}
          style={{ '--swipe-toast-bg': background, '--swipe-toast-color': color, '--swipe-toast-fuse': fuseColor }}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 36, scale: .98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 36, scale: .98 }}
          transition={{ duration: reduceMotion ? .12 : .36, ease: [.23, 1, .32, 1] }}
          drag={reduceMotion ? false : 'y'}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: .12, bottom: .45 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 40 || info.velocity.y > 450) requestClose('swipe')
          }}
          onPointerEnter={pauseTimer}
          onPointerLeave={resumeTimer}
          onFocus={pauseTimer}
          onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) resumeTimer() }}
          onKeyDown={(event) => { if (event.key === 'Escape') requestClose('escape') }}
        >
          <span className="swipe-toast__icon" aria-hidden="true"><CheckCircle2 size={20} strokeWidth={2} /></span>
          <span className="swipe-toast__copy">
            <strong>{title}</strong>
            {description && <span>{description}</span>}
          </span>
          <button className="swipe-toast__dismiss" type="button" aria-label="Fechar aviso" onClick={() => requestClose('close')}>
            <span aria-hidden="true">×</span>
          </button>
          {duration > 0 && <span className={`swipe-toast__fuse${paused ? ' is-paused' : ''}`} style={{ animationDuration: `${duration}ms` }} aria-hidden="true" />}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

export default SwipeToast
