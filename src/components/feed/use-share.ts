'use client'

import { useState, useCallback } from 'react'

interface ShareOptions {
  title: string
  text: string
  url: string
}

export function useShare(options: ShareOptions | null) {
  const [copied, setCopied] = useState(false)

  const share = useCallback(async () => {
    if (!options) return

    if (navigator.share) {
      try {
        await navigator.share(options)
      } catch {
        // User cancelled or share failed
      }
    } else if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(options.url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // Clipboard write failed
      }
    }
  }, [options])

  return { share, copied }
}
