const THEME_STORAGE_KEY = 'deshi.theme'
const ALWAYS_LIGHT_PATHS = new Set(['/', '/login', '/cadastro'])

export function getTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'
}

export function applyTheme(theme) {
  const nextTheme = theme === 'dark' ? 'dark' : 'light'
  const root = document.documentElement
  root.dataset.theme = nextTheme
  root.classList.toggle('dark', nextTheme === 'dark')
  root.style.colorScheme = nextTheme
  return nextTheme
}

export function setTheme(theme) {
  const nextTheme = applyTheme(theme)
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
  return nextTheme
}

export function applyRouteTheme(pathname) {
  return applyTheme(ALWAYS_LIGHT_PATHS.has(pathname) ? 'light' : getTheme())
}
