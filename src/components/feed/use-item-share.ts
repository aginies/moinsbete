'use client'

import { useState, useCallback } from 'react'

interface UseShareOptions {
  shareUrl: string
  title: string
  text: string
  itemId?: string
}

export function useItemShare(options: UseShareOptions) {
  const { shareUrl, title, text, itemId } = options
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null)
  const isCopied = itemId ? copiedItemId === itemId : false

  const handleShare = useCallback(async () => {
    if (isCopied) return

    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(shareUrl)
        if (itemId) {
          setCopiedItemId(itemId)
          setTimeout(() => setCopiedItemId(null), 2000)
        }
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
