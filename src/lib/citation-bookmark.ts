import type { BookmarkType } from '@/generated/client'
import { createBookmarkManager } from '@/lib/bookmark-manager'

export interface CitationFavoriteDoc {
  id: string
  text: string
  author: string
  source: string
  url: string
  category: string
  imageUrl: string
  favoritedAt: string
}

export interface CitationFavoriteMeta {
  text?: string
  author?: string
  source?: string
  url?: string
  category?: string
  imageUrl?: string
}

export const CITATION_TYPE: BookmarkType = 'CITATION'

export const citationManager = createBookmarkManager(CITATION_TYPE, (meta, resourceId) => {
  const m = meta as CitationFavoriteMeta | null
  if (!m) return null
  return {
    id: resourceId,
    text: m.text || '',
    author: m.author || '',
    source: m.source || '',
    url: m.url || '',
    category: m.category || '',
    imageUrl: m.imageUrl || '',
    favoritedAt: new Date().toISOString(),
  }
})

export const getCitationFavorites = citationManager.getFavorites.bind(citationManager)
export const getCitationFavoritesCount = citationManager.getFavoritesCount.bind(citationManager)
