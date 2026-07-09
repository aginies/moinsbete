import type { BookmarkType } from '@/generated/client'
import {
  toggleFavorite,
  isFavorite,
  getFavorites,
  getFavoritesCount,
} from '@/lib/favorite'
import type { SaviezVousFavoriteDoc } from '@/components/feed/saviez-vous-bookmarks'

export interface SaviezVousFavoriteMeta {
  text?: string
  sourceUrl?: string | null
  imageFilename?: string | null
}

const TYPE: BookmarkType = 'SAVIEZ_VOUS'

function mapMeta(meta: unknown, resourceId: string): SaviezVousFavoriteDoc | null {
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

export async function toggleSaviezVousFavorite(
  userId: string,
  factId: string,
  action?: 'add' | 'remove',
  meta?: SaviezVousFavoriteMeta,
) {
  return toggleFavorite(userId, TYPE, factId, action, meta as Record<string, unknown>)
}

export async function isSaviezVousFavorite(userId: string, factId: string): Promise<boolean> {
  return isFavorite(userId, TYPE, factId)
}

export async function getSaviezVousFavorites(userId: string): Promise<SaviezVousFavoriteDoc[]> {
  const items = await getFavorites(userId, TYPE)
  return items
    .map((item) => mapMeta(item.meta, item.resourceId || ''))
    .filter((d): d is SaviezVousFavoriteDoc => d !== null)
}

export async function getSaviezVousFavoritesCount(userId: string): Promise<number> {
  return getFavoritesCount(userId, TYPE)
}
