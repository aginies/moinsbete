'use client'

import { useEffect } from 'react'

const TRACKING_KEY = 'last_visit_tracking'
const DEBOUNCE_MS = 30 * 60 * 1000

export function useVisitTracking() {
  useEffect(() => {
    const lastTracking = localStorage.getItem(TRACKING_KEY)
    const lastTime = lastTracking ? parseInt(lastTracking, 10) : 0
    const now = Date.now()

    if (now - lastTime < DEBOUNCE_MS) {
      return
    }

    fetch('/api/track/visit', { signal: AbortSignal.timeout(5000) }).finally(() => {
      localStorage.setItem(TRACKING_KEY, String(now))
    })
  }, [])
}
