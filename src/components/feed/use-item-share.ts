'use client'

import { useState, useCallback, useRef } from 'react'

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

  const optionsRef = useRef(options)
  optionsRef.current = options

  const handleShare = useCallback(async () => {
    if (isCopied) return

    const { shareUrl: url, title: t, text: txt } = optionsRef.current

    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(url)
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
        await navigator.share({ title: t, text: txt, url })
      } catch {
        // User cancelled or share failed
      }
    }
  }, [isCopied, itemId])

  return { handleShare, copied: isCopied, shareUrl }
}
