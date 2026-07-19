'use client'

import { useEffect } from 'react'

export function useVisitTracking() {
  useEffect(() => {
    fetch('/api/track/visit', { signal: AbortSignal.timeout(5000) }).catch(() => {})
  }, [])
}
