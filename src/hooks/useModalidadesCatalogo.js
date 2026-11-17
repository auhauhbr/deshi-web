import { useEffect, useState } from 'react'
import { getMinhasModalidades } from '../services/modalidades.service.js'

export function useModalidadesCatalogo() {
  const [modalidades, setModalidades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    getMinhasModalidades(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setModalidades(data)
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [attempt])

  function retry() {
    setLoading(true)
    setError('')
    setAttempt((value) => value + 1)
  }

  return { modalidades, loading, error, retry }
}
