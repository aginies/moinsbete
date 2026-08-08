'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { shareResourceToLobby, unshareResourceFromLobby } from '@/actions/lobby-share-actions'
import { toast } from 'sonner'

export function useShareToLobby<T>(
  type: string,
  sharedIds: Set<string>,
  setSharedIds: React.Dispatch<React.SetStateAction<Set<string>>>,
  getResourceId: (item: T) => string,
  getItemMeta?: (item: T) => any,
) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const toggle = useCallback(async (item: T) => {
    const id = getResourceId(item)
    setLoadingId(id)
    try {
      const isShared = sharedIds.has(id)
      if (isShared) {
        await unshareResourceFromLobby(type, id)
        setSharedIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        toast.success('Retiré du lobby')
        router.refresh()
      } else {
        const meta = getItemMeta?.(item)
        const result = await shareResourceToLobby(type, id, meta)
        if (result.success) {
          setSharedIds(prev => new Set([...prev, id]))
          toast.success('Partagé au lobby')
          router.refresh()
        } else {
          toast.error(result.error)
        }
      }
    } finally {
      setLoadingId(null)
    }
  }, [type, sharedIds, setSharedIds, getResourceId, getItemMeta, router])

  const isSharing = loadingId

  return { toggle, isSharing }
}
