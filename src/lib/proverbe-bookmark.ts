import type { BookmarkType } from '@/generated/client'
import type { ProverbeFavoriteDoc } from '@/app/(main)/favoris/proverbe-bookmarks'
import { createBookmarkManager } from '@/lib/bookmark-manager'

export interface ProverbeFavoriteMeta {
  text?: string
  signification?: string
  source?: string
  url?: string
}

export const PROVERBE_TYPE: BookmarkType = 'PROVERBE'

export const proverbeManager = createBookmarkManager(PROVERBE_TYPE, (meta, resourceId) => {
  const m = meta as ProverbeFavoriteMeta | null
  if (!m) return null
  return {
    id: resourceId,
    text: m.text || '',
    signification: m.signification || '',
    source: m.source || '',
    url: m.url || '',
    favoritedAt: new Date().toISOString(),
  }
})

export const getProverbeFavorites = proverbeManager.getFavorites.bind(proverbeManager)
export const getProverbeFavoritesCount = proverbeManager.getFavoritesCount.bind(proverbeManager)
