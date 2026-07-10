import type { BookmarkType } from '@/generated/client'
import type { FavoriteDoc } from '@/app/(main)/favoris/radio-france-favorites'
import { createBookmarkManager } from '@/lib/bookmark-manager'

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

const mapMeta: (meta: unknown, resourceId: string) => FavoriteDoc | null = (meta, resourceId) => {
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

export const radioManager = createBookmarkManager(TYPE, mapMeta)

export const getRadioFavorites = radioManager.getFavorites.bind(radioManager)
export const getRadioFavoritesCount = radioManager.getFavoritesCount.bind(radioManager)

export async function toggleRadioFavorite(userId: string, docId: string, action?: 'add' | 'remove', meta?: RadioFavoriteMeta) {
  return radioManager.toggle(userId, docId, action, meta as Record<string, unknown>)
}

export async function isRadioFavorite(userId: string, docId: string): Promise<boolean> {
  return radioManager.isBookmarked(userId, docId)
}
