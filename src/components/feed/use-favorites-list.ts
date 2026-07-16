'use client'

import { useCallback } from 'react'

interface UseFavoritesListOptions<Doc extends { id: string }> {
  userId?: string
  storageKey: string
  resourceIdGetter: (item: Doc) => string
  bookmarkType: string
}

export function useFavoritesList<Doc extends { id: string }>({
  userId,
  storageKey,
  resourceIdGetter,
  bookmarkType,
}: UseFavoritesListOptions<Doc>) {
  const handleRemove = useCallback(async (item: Doc) => {
    if (userId) {
      try {
        const { toggleBookmarkAction } = await import('@/actions/favorite-actions')
        await toggleBookmarkAction(bookmarkType, resourceIdGetter(item), 'remove')
      } catch {
        // localStorage fallback
      }
    }
  }, [userId, bookmarkType, resourceIdGetter])

  const getFavorites = useCallback(async () => {
    if (userId) {
      return null // caller should fetch from DB via action
    }
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }, [userId, storageKey])

  return { handleRemove, getFavorites }
}
