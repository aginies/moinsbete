import type { BookmarkType } from '@/generated/client'
import { createBookmarkManager } from '@/lib/bookmark-manager'

export interface BbcFavoriteMeta {
  title?: string
  description?: string
  url?: string
  imageUrl?: string
  source?: string
  category?: string
  publishedAt?: string
}

export interface BbcFavorite {
  id: string
  title: string
  description: string
  url: string
  imageUrl?: string
  source: string
  category: string
  publishedAt: string
  favoritedAt: string
}

export const BBC_TYPE: BookmarkType = 'BBC_NEWS'

export const bbcManager = createBookmarkManager(BBC_TYPE, (meta, resourceId) => {
  const m = meta as BbcFavoriteMeta | null
  if (!m) return null
  return {
    id: resourceId,
    title: m.title || '',
    description: m.description || '',
    url: m.url || '',
    imageUrl: m.imageUrl,
    source: m.source || '',
    category: m.category || '',
    publishedAt: m.publishedAt || new Date().toISOString(),
    favoritedAt: new Date().toISOString(),
  }
})

export const getBbcFavorites = bbcManager.getFavorites.bind(bbcManager)
export const getBbcFavoritesCount = bbcManager.getFavoritesCount.bind(bbcManager)
