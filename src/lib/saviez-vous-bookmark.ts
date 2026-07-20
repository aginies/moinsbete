import type { BookmarkType } from '@/generated/client'
import { createBookmarkManager } from '@/lib/bookmark-manager'

export interface SaviezVousFavoriteMeta {
  text?: string
  sourceUrl?: string | null
  imageFilename?: string | null
}

export const SAVIEZ_VOUS_TYPE: BookmarkType = 'SAVIEZ_VOUS'

export const saviezVousManager = createBookmarkManager(SAVIEZ_VOUS_TYPE, (meta, resourceId) => {
  const m = meta as SaviezVousFavoriteMeta | null
  if (!m) return null
  return {
    id: resourceId,
    text: m.text || '',
    sourceUrl: m.sourceUrl ?? null,
    imageFilename: m.imageFilename ?? null,
    favoritedAt: new Date().toISOString(),
  }
})

export const getSaviezVousFavorites = saviezVousManager.getFavorites.bind(saviezVousManager)
export const getSaviezVousFavoritesCount = saviezVousManager.getFavoritesCount.bind(saviezVousManager)
