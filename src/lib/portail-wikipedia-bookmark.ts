import type { BookmarkType } from '@/generated/client'
import { createBookmarkManager } from '@/lib/bookmark-manager'

export interface PortailWikipediaFavoriteMeta {
  title?: string
  extract?: string
  imageUrl?: string | null
  pageUrl?: string | null
}

export interface PortailWikipediaFavorite {
  id: string
  title: string
  extract: string
  imageUrl: string | null
  pageUrl: string | null
  favoritedAt: string
}

export const PORTAIL_WIKIPEDIA_TYPE: BookmarkType = 'PORTAIL_WIKIPEDIA'

export const portailWikipediaManager = createBookmarkManager(PORTAIL_WIKIPEDIA_TYPE, (meta, resourceId) => {
  const m = meta as PortailWikipediaFavoriteMeta | null
  if (!m) return null
  return {
    id: resourceId,
    title: m.title || '',
    extract: m.extract || '',
    imageUrl: m.imageUrl ?? null,
    pageUrl: m.pageUrl ?? null,
    favoritedAt: new Date().toISOString(),
  }
})

export const getPortailWikipediaFavorites = portailWikipediaManager.getFavorites.bind(portailWikipediaManager)
export const getPortailWikipediaFavoritesCount = portailWikipediaManager.getFavoritesCount.bind(portailWikipediaManager)
