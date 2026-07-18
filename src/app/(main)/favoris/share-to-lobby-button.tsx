'use client'

import { Share2 } from 'lucide-react'

interface ShareToLobbyFavoritesButtonProps {
  isShared: boolean
  onToggle: () => void
  loading: boolean
  resourceId: string
}

export function ShareToLobbyFavoritesButton({ isShared, onToggle, loading, resourceId }: ShareToLobbyFavoritesButtonProps) {
  return (
    <button
      type="button"
      className={`rounded-full px-2 py-1.5 flex items-center gap-1 opacity-60 hover:opacity-100 hover:bg-muted transition-all ${isShared ? 'text-green-500' : 'text-muted-foreground'}`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onToggle()
      }}
      disabled={loading}
      title={isShared ? 'Retirer du lobby' : 'Partager au lobby'}
    >
      <Share2 className="h-4 w-4" />
      <span className="text-xs">Lobby</span>
    </button>
  )
}
