'use client'

import { useState, useCallback } from 'react'

interface UseItemShareOptions {
  shareUrl: string
  title: string
  text: string
  itemId: string
}

export function useItemShare({ shareUrl, title, text, itemId }: UseItemShareOptions) {
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null)
  const isCopied = copiedItemId === itemId

  const handleShare = useCallback(async () => {
    if (isCopied) return

    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(shareUrl)
        setCopiedItemId(itemId)
        setTimeout(() => setCopiedItemId(null), 2000)
      } catch {
        // Clipboard write failed
      }
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl })
      } catch {
        // User cancelled or share failed
      }
    }
  }, [isCopied, shareUrl, itemId, title, text])

  return { handleShare, copied: isCopied, shareUrl }
}
