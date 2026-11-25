import { motion } from 'motion/react'
import { Moon, Sun } from 'lucide-react'
import './switch-button.css'

export default function SwitchButton({ checked = false, onCheckedChange, className = '' }) {
  const label = checked ? 'Ativar tema claro' : 'Ativar tema escuro'

  return (
    <motion.button
      className={`kokonut-switch-button${checked ? ' is-checked' : ''} ${className}`.trim()}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={() => onCheckedChange?.(!checked)}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 460, damping: 30 }}
    >
      <span className="kokonut-switch-button__icon kokonut-switch-button__icon--sun" aria-hidden="true"><Sun /></span>
      <span className="kokonut-switch-button__icon kokonut-switch-button__icon--moon" aria-hidden="true"><Moon /></span>
      <motion.span className="kokonut-switch-button__thumb" layout transition={{ type: 'spring', stiffness: 520, damping: 34 }} />
    </motion.button>
  )
}
