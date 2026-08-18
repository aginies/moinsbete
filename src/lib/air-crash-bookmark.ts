import type { BookmarkType } from '@/generated/client'
import { createBookmarkManager } from '@/lib/bookmark-manager'

export interface AirCrashFavoriteMeta {
  title?: string
  description?: string
  url?: string | null
  imageUrl?: string | null
}

export const AIR_CRASH_TYPE: BookmarkType = 'AIR_CRASH'

export const airCrashManager = createBookmarkManager(AIR_CRASH_TYPE, (meta, resourceId) => {
  const m = meta as AirCrashFavoriteMeta | null
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

export const getAirCrashFavorites = airCrashManager.getFavorites.bind(airCrashManager)
export const getAirCrashFavoritesCount = airCrashManager.getFavoritesCount.bind(airCrashManager)
