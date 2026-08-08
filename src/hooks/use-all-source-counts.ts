'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export function useAllSourceCounts(initialCounts: Record<string, number>) {
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts)
  const deltasRef = useRef<Record<string, number>>({})

  useEffect(() => {
    const applied: Record<string, number> = {}
    for (const [key, base] of Object.entries(initialCounts)) {
      applied[key] = Math.max(0, base + (deltasRef.current[key] || 0))
    }
    setCounts(applied)
  }, [initialCounts])

  const handleRemove = useCallback((sourceKey: string) => {
    deltasRef.current[sourceKey] = (deltasRef.current[sourceKey] || 0) - 1
    setCounts(prev => ({
      ...prev,
      [sourceKey]: Math.max(0, (prev[sourceKey] || 0) - 1),
    }))
  }, [])

  return { counts, handleRemove }
}
