'use client'

import { useState, useEffect, useCallback } from 'react'
import { Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { shareResourceToLobby, unshareResourceFromLobby, isSharedResourceToLobby } from '@/actions/lobby-share-actions'
import { toast } from 'sonner'

interface ShareToLobbyButtonProps {
  resourceId: string
  resourceType: string
  icon?: React.ReactNode
  className?: string
}

export function ShareToLobbyButton({ resourceId, resourceType, icon, className }: ShareToLobbyButtonProps) {
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
        await shareResourceToLobby(resourceType, resourceId)
        setIsShared(true)
        toast.success('Partagé au lobby')
      }
    } catch {
      toast.error('Erreur lors du partage')
    } finally {
      setLoading(false)
    }
  }, [isShared, resourceId, resourceType, loading])

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={(e) => {
        e.stopPropagation()
        handleToggle()
      }}
      disabled={loading}
      title={isShared ? 'Retirer du lobby' : 'Partager au lobby'}
    >
      {icon || <Share2 className={`h-4 w-4 ${isShared ? 'text-green-500' : 'text-muted-foreground'}`} />}
    </Button>
  )
}
