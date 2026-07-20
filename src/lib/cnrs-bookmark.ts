import type { BookmarkType } from '@/generated/client'
import type { CnrsFavoriteDoc } from '@/components/feed/cnrs-bookmarks'
import { createBookmarkManager } from '@/lib/bookmark-manager'

export interface CnrsFavoriteMeta {
  title?: string
  category?: string
  imageUrl?: string
  link?: string
  date?: string
}

export const CNRS_TYPE: BookmarkType = 'CNRS_NEWS'

export const cnrsManager = createBookmarkManager(CNRS_TYPE, (meta, resourceId) => {
  const m = meta as CnrsFavoriteMeta | null
  if (!m) return null
  return {
    id: resourceId,
    title: m.title || '',
    category: m.category || '',
    imageUrl: m.imageUrl,
    link: m.link || '',
    date: m.date || '',
    favoritedAt: new Date().toISOString(),
  }
})

export const getCnrsFavorites = cnrsManager.getFavorites.bind(cnrsManager)
export const getCnrsFavoritesCount = cnrsManager.getFavoritesCount.bind(cnrsManager)
