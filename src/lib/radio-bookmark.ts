import type { BookmarkType } from '@/generated/client'
import {
  toggleBookmark,
  isBookmarked,
  getBookmarks,
  getBookmarksCount,
  type BookmarkItem,
} from '@/lib/favorite'
import type { FavoriteDoc } from '@/app/(main)/favoris/radio-france-favorites'

export interface RadioFavoriteMeta {
  title?: string
  description?: string
  url?: string
  radio?: string
  section?: string
  image?: string
  favoritedAt?: string
}

const TYPE: BookmarkType = 'RADIO_FRANCE'

function mapMeta(meta: unknown): FavoriteDoc | null {
  const m = meta as RadioFavoriteMeta | null
  if (!m) return null
  return {
    id: m.favoritedAt || '',
    title: m.title || '',
    description: m.description || '',
    url: m.url || '',
    radio: m.radio || '',
    section: m.section || '',
    image: m.image,
    favoritedAt: m.favoritedAt || new Date().toISOString(),
  }
}

export async function toggleRadioFavorite(
  userId: string,
  docId: string,
  action?: 'add' | 'remove',
  meta?: RadioFavoriteMeta,
) {
  return toggleBookmark(userId, TYPE, docId, action, meta as Record<string, unknown>)
}

export async function isRadioFavorite(userId: string, docId: string): Promise<boolean> {
  return isBookmarked(userId, TYPE, docId)
}

export async function getRadioFavorites(userId: string): Promise<FavoriteDoc[]> {
  const items = await getBookmarks(userId, TYPE)
  return items
    .map((item) => {
      const mapped = mapMeta(item.meta)
      if (!mapped) return null
      return { ...mapped, id: item.resourceId }
    })
    .filter((d): d is FavoriteDoc => d !== null)
}

export async function getRadioFavoritesCount(userId: string): Promise<number> {
  return getBookmarksCount(userId, TYPE)
}
