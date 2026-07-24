'use client'

import { useEffect, useState } from 'react'

const DEFAULT_INTERVAL = 24 * 60 * 60 * 1000

export function useAutoRefresh(storageKey: string, refresh: () => void, intervalMs = DEFAULT_INTERVAL) {
  const [lastRefresh, setLastRefresh] = useState(() => {
    if (typeof window === 'undefined') return 0
    return parseInt(localStorage.getItem(`last_refresh_${storageKey}`) || '0', 10)
  })

  useEffect(() => {
    if (Date.now() - lastRefresh >= intervalMs) {
      refresh()
      setLastRefresh(Date.now())
      localStorage.setItem(`last_refresh_${storageKey}`, String(Date.now()))
    }
  }, [lastRefresh, intervalMs, refresh])
}
