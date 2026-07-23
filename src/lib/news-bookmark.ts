import type { BookmarkType } from '@/generated/client'
import { createBookmarkManager } from '@/lib/bookmark-manager'

export interface NewsFavoriteMeta {
  title?: string
  description?: string
  url?: string
  imageUrl?: string
  source?: string
  category?: string
  publishedAt?: string
}

export interface NewsFavorite {
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

export const NEWS_TYPE: BookmarkType = 'NEWS'

export const newsManager = createBookmarkManager(NEWS_TYPE, (meta, resourceId) => {
  const m = meta as NewsFavoriteMeta | null
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

export const getNewsFavorites = newsManager.getFavorites.bind(newsManager)
export const getNewsFavoritesCount = newsManager.getFavoritesCount.bind(newsManager)
