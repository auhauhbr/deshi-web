import { Link } from 'react-router-dom'

function BrandLogo({ className = '', variant = 'light', to, ...props }) {
  const source = variant === 'dark' ? '/Logo-Deshi.png' : '/Logo-Deshi-black.png'
  const logo = (
    <img
      className={`${className} brand-logo-${variant}`.trim()}
      src={source}
      alt={to ? '' : 'Deshi'}
      {...props}
    />
  )

  return to ? <Link to={to} aria-label="Deshi - ir para início">{logo}</Link> : logo
}

export default BrandLogo
