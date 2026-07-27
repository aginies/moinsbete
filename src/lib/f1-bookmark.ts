import type { BookmarkType } from '@/generated/client'
import { createBookmarkManager } from '@/lib/bookmark-manager'

export interface F1FavoriteMeta {
  title?: string
  section?: string
  imageUrl?: string
  url?: string
  description?: string
  date?: string
  content?: string
}

export const F1_TYPE: BookmarkType = 'F1'

export const f1Manager = createBookmarkManager(F1_TYPE, (meta, resourceId) => {
  const m = meta as F1FavoriteMeta | null
  if (!m) return null
  return {
    id: resourceId,
    title: m.title || '',
    section: m.section || '',
    imageUrl: m.imageUrl,
    link: m.url || '',
    favoritedAt: new Date().toISOString(),
    date: m.date as string | undefined,
    content: m.description || m.content as string | undefined,
  }
})

export const getF1Favorites = f1Manager.getFavorites.bind(f1Manager)
export const getF1FavoritesCount = f1Manager.getFavoritesCount.bind(f1Manager)
