import type { BookmarkType } from '@/generated/client'
import type { SaviezVousFavoriteDoc } from '@/components/feed/saviez-vous-bookmarks'
import { createBookmarkManager } from '@/lib/bookmark-manager'

export interface SaviezVousFavoriteMeta {
  text?: string
  sourceUrl?: string | null
  imageFilename?: string | null
}

const TYPE: BookmarkType = 'SAVIEZ_VOUS'

const mapMeta: (meta: unknown, resourceId: string) => SaviezVousFavoriteDoc | null = (meta, resourceId) => {
  const m = meta as SaviezVousFavoriteMeta | null
  if (!m) return null
  return {
    id: resourceId,
    text: m.text || '',
    sourceUrl: m.sourceUrl ?? null,
    imageFilename: m.imageFilename ?? null,
    favoritedAt: new Date().toISOString(),
  }
}

export const saviezVousManager = createBookmarkManager(TYPE, mapMeta)

export const getSaviezVousFavorites = saviezVousManager.getFavorites.bind(saviezVousManager)
export const getSaviezVousFavoritesCount = saviezVousManager.getFavoritesCount.bind(saviezVousManager)
