import { useNavigate } from 'react-router-dom'

export default function PageAppBar({ title, backTo, backLabel }) {
  const navigate = useNavigate()

  return (
    <div className="page-app-bar">
      <button className="app-back-button" type="button" aria-label={backLabel} onClick={() => navigate(backTo)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m14 6-6 6 6 6" />
        </svg>
      </button>
      <h1>{title}</h1>
    </div>
  )
}
