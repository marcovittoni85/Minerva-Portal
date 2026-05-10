import { useState, useEffect } from 'react'

const LOADING_MESSAGES = [
  'Caricamento in corso...',
  'L\'ecosistema sta lavorando per te...',
  'Quasi pronto...',
  'Un momento di pazienza...',
]

export function useLoadingMessage(loading: boolean): string {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!loading) return
    const interval = setInterval(() => {
      setIndex(i => (i + 1) % LOADING_MESSAGES.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [loading])

  return LOADING_MESSAGES[index]
}
