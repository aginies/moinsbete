'use client'

import { useState, useCallback, useEffect } from 'react'

interface UseSimpleBookmarkToggleOptions {
  toggleFn: (action: 'add' | 'remove') => Promise<void>
  resourceId: string | null | undefined
  meta?: Record<string, unknown> | null | undefined
  guard?: () => boolean
  initialFavorite?: boolean
  onFavoriteChange?: (fav: boolean) => void
}

export function useSimpleBookmarkToggle({
  toggleFn,
  resourceId,
  meta,
  guard,
  initialFavorite = false,
  onFavoriteChange,
}: UseSimpleBookmarkToggleOptions) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite)
  const [isPending, setIsPending] = useState(false)

  // Keep internal state in sync with initialFavorite prop changes
  useEffect(() => {
    setIsFavorite(initialFavorite)
  }, [initialFavorite])

  const handleBookmark = useCallback(async () => {
    if (!resourceId || guard?.()) return
    const newFavorite = !isFavorite
    setIsPending(true)
    try {
      await toggleFn(newFavorite ? 'add' : 'remove')
      setIsFavorite(newFavorite)
      onFavoriteChange?.(newFavorite)
    } catch {
      setIsFavorite(prev => !prev)
      onFavoriteChange?.(!newFavorite)
    } finally {
      setIsPending(false)
    }
  }, [toggleFn, resourceId, meta, guard, isFavorite, onFavoriteChange])

  return { isFavorite, isPending, handleBookmark, setIsFavorite }
}
