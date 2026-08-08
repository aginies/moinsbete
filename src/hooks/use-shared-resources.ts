'use client'

import { useState, useEffect } from 'react'

export function useSharedResources(type: string, userId?: string) {
  const [resourceIds, setResourceIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!userId) return
    const load = async () => {
      try {
        const res = await fetch(`/api/lobby/shared-resources?type=${type}`)
        const data = await res.json()
        if (data.resourceIds) {
          setResourceIds(new Set(data.resourceIds))
        }
      } catch (err) {
        console.error(`Failed to load ${type} shared state:`, err)
      }
    }
    load()
  }, [userId, type])

  return [resourceIds, setResourceIds] as const
}
