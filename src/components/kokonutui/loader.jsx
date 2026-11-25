import './loader.css'

export default function Loader({
  title = 'Carregando...',
  subtitle = '',
  size = 'md',
  className = '',
  ...props
}) {
  return (
    <div className={`kokonut-loader kokonut-loader--${size} ${className}`.trim()} role="status" aria-live="polite" aria-busy="true" {...props}>
      <span className="kokonut-loader__rings" aria-hidden="true"><i /><i /><i /></span>
      <span className="kokonut-loader__copy">
        <strong>{title}</strong>
        {subtitle && <span>{subtitle}</span>}
      </span>
    </div>
  )
}
