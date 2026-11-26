import { Link } from 'react-router-dom'
import './BrandLogo.css'

function BrandLogo({ className = '', variant = 'light', to, ...props }) {
  const logo = variant === 'adaptive'
    ? (
      <span className={`brand-logo-adaptive ${className}`.trim()} role={to ? undefined : 'img'} aria-label={to ? undefined : 'Deshi'} {...props}>
        <img className="brand-logo-adaptive-light" src="/Logo-Deshi-black.png" alt="" />
        <img className="brand-logo-adaptive-dark" src="/Logo-Deshi.png" alt="" />
      </span>
    )
    : null
  const source = variant === 'dark' ? '/Logo-Deshi.png' : '/Logo-Deshi-black.png'
  const staticLogo = (
    <img
      className={`${className} brand-logo-${variant}`.trim()}
      src={source}
      alt={to ? '' : 'Deshi'}
      {...props}
    />
  )

  const content = logo || staticLogo
  return to ? <Link to={to} aria-label="Deshi - ir para início">{content}</Link> : content
}

export default BrandLogo
