'use client'

import { useState, useCallback } from 'react'

interface ShareOptions {
  title: string
  text: string
  url: string
}

export function useShare(options: ShareOptions | null) {
  const [copied, setCopied] = useState(false)
  const shareUrl = options?.url ?? ''

  const share = useCallback(async () => {
    if (!options) return

    // Step 1: Always copy to clipboard first (most reliable)
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(options.url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // Clipboard write failed
      }
    }

    // Step 2: Try native share if available
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(options)
      } catch {
        // User cancelled or share failed
      }
    }
  }, [options])

  return { share, copied, shareUrl }
}
