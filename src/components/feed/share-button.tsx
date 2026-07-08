'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'

interface ShareButtonProps {
  onClick: () => Promise<void>
  copied: boolean
  shareUrl: string
}

export function ShareButton({ onClick, copied, shareUrl }: ShareButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <>
      <div className="relative">
        <button
          type="button"
          className="rounded-full bg-amber-100/80 p-1.5 text-amber-600 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:hover:bg-amber-800/40 transition-colors"
          onClick={(e) => { e.stopPropagation(); onClick() }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Share2 className="h-4 w-4" />
        </button>
        {showTooltip && (
          <div className="absolute right-0 top-full z-20 mt-1 w-64 overflow-hidden rounded-lg border border-border/60 bg-card p-2 shadow-lg">
            <p className="mb-1 text-xs text-muted-foreground">Lien à partager:</p>
            <p className="break-all text-xs font-mono text-primary">{shareUrl}</p>
          </div>
        )}
      </div>
      {copied && (
        <div className="pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-full bg-green-500/90 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm">
          Copié !
        </div>
      )}
    </>
  )
}
