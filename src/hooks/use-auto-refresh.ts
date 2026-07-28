'use client'

import { useEffect, useState } from 'react'

const DEFAULT_INTERVAL = 24 * 60 * 60 * 1000

export function useAutoRefresh(storageKey: string, refresh: () => void, intervalMs = DEFAULT_INTERVAL) {
  const [lastRefresh, setLastRefresh] = useState<number | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`last_refresh_${storageKey}`)
      if (saved) {
        setLastRefresh(parseInt(saved, 10))
      } else {
        const now = Date.now()
        setLastRefresh(now)
        localStorage.setItem(`last_refresh_${storageKey}`, String(now))
      }
    } catch {
      setLastRefresh(Date.now())
    }
  }, [storageKey])

  useEffect(() => {
    if (lastRefresh === null) return

    if (Date.now() - lastRefresh >= intervalMs) {
      refresh()
      const now = Date.now()
      setLastRefresh(now)
      try {
        localStorage.setItem(`last_refresh_${storageKey}`, String(now))
      } catch {
        // Ignore storage errors
      }
    }
  }, [lastRefresh, intervalMs, refresh, storageKey])
}
