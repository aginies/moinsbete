import type { BookmarkType } from '@/generated/client'
import { createBookmarkManager } from '@/lib/bookmark-manager'

export interface InsoliteFavoriteMeta {
  title?: string
  description?: string
  url?: string | null
  imageUrl?: string | null
}

export const INSOLITE_TYPE: BookmarkType = 'INSOLITE'

export const insoliteManager = createBookmarkManager(INSOLITE_TYPE, (meta, resourceId) => {
  const m = meta as InsoliteFavoriteMeta | null
  if (!m) return null
  return {
    id: resourceId,
    title: m.title || '',
    description: m.description || '',
    url: m.url ?? null,
    imageUrl: m.imageUrl ?? null,
    favoritedAt: new Date().toISOString(),
  }
})

export const getInsoliteFavorites = insoliteManager.getFavorites.bind(insoliteManager)
export const getInsoliteFavoritesCount = insoliteManager.getFavoritesCount.bind(insoliteManager)
