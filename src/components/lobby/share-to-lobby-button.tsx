'use client'

import { useState, useEffect, useCallback } from 'react'
import { Share2 } from 'lucide-react'
import { shareResourceToLobby, unshareResourceFromLobby, isSharedResourceToLobby } from '@/actions/lobby-share-actions'
import { toast } from 'sonner'

interface ShareToLobbyButtonProps {
  resourceId: string
  resourceType: string
  icon?: React.ReactNode
  className?: string
  meta?: Record<string, unknown>
}

export function ShareToLobbyButton({ resourceId, resourceType, icon, className, meta }: ShareToLobbyButtonProps) {
  const [isShared, setIsShared] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    isSharedResourceToLobby(resourceType, resourceId).then(setIsShared).catch(() => {})
  }, [resourceType, resourceId])

  const handleToggle = useCallback(async () => {
    if (loading) return
    setLoading(true)
    try {
      if (isShared) {
        await unshareResourceFromLobby(resourceType, resourceId)
        setIsShared(false)
        toast.success('Retiré du lobby')
      } else {
        await shareResourceToLobby(resourceType, resourceId, meta)
        setIsShared(true)
        toast.success('Partagé au lobby')
      }
    } catch {
      toast.error('Erreur lors du partage')
    } finally {
      setLoading(false)
    }
  }, [isShared, resourceId, resourceType, loading, meta])

  return (
    <button
      type="button"
      className={`rounded-full px-2 py-1.5 flex items-center gap-1 opacity-60 hover:opacity-100 hover:bg-muted transition-all ${isShared ? 'text-green-500' : 'text-muted-foreground'} ${className || ''}`}
      onClick={(e) => {
        e.stopPropagation()
        handleToggle()
      }}
      disabled={loading}
      title={isShared ? 'Retirer du lobby' : 'Partager au lobby'}
    >
      {icon || <Share2 className="h-4 w-4" />}
      <span className="text-xs">Lobby</span>
    </button>
  )
}
