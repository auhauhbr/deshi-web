import { useEffect, useState } from 'react'

export default function Snackbar({ notification }) {
  const [dismissedNotification, setDismissedNotification] = useState(null)

  useEffect(() => {
    if (!notification) return
    const timeout = setTimeout(() => setDismissedNotification(notification), 2800)
    return () => clearTimeout(timeout)
  }, [notification])

  return (
    <div className="snackbar" role="status" aria-live="polite" aria-atomic="true">
      {notification && notification !== dismissedNotification && <p>{notification.message}</p>}
    </div>
  )
}
