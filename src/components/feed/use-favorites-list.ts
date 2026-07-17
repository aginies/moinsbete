'use client'

import { useCallback } from 'react'
import type { BookmarkType } from '@/generated/client'

interface UseFavoritesListOptions<Doc extends { id: string }> {
  userId?: string
  storageKey: string
  resourceIdGetter: (item: Doc) => string
  bookmarkType: BookmarkType
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
      const stored = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }, [userId, storageKey])

  return { handleRemove, getFavorites }
}
