'use client'

import { Share2 } from 'lucide-react'

interface ShareButtonProps {
  onClick: () => Promise<void>
  copied: boolean
}

export function ShareButton({ onClick, copied }: ShareButtonProps) {
  return (
    <>
      <button
        type="button"
        className="rounded-full bg-amber-100/80 p-1.5 text-amber-600 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:hover:bg-amber-800/40 transition-colors"
        onClick={(e) => { e.stopPropagation(); onClick() }}
      >
        <Share2 className="h-4 w-4" />
      </button>
      {copied && (
        <div className="pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-full bg-green-500/90 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm">
          Copié !
        </div>
      )}
    </>
  )
}
