function BrandLogo({ className = '', variant = 'light', ...props }) {
  const source = variant === 'dark' ? '/Logo-Deshi.png' : '/Logo-Deshi-black.png'

  return (
    <img
      className={`${className} brand-logo-${variant}`.trim()}
      src={source}
      alt="Deshi"
      {...props}
    />
  )
}

export default BrandLogo
