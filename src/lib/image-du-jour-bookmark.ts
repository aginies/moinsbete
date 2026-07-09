import type { BookmarkType } from '@/generated/client'
import {
  toggleFavorite,
  isFavorite,
  getFavorites,
  getFavoritesCount,
} from '@/lib/favorite'
import type { ImageDuJourFavoriteDoc } from '@/components/feed/image-du-jour-bookmarks'

export interface ImageDuJourFavoriteMeta {
  imageUrl?: string
  description?: string
  fileUrl?: string
  date?: string
}

const TYPE: BookmarkType = 'IMAGE_DU_JOUR'

function mapMeta(meta: unknown, resourceId: string): ImageDuJourFavoriteDoc | null {
  const m = meta as ImageDuJourFavoriteMeta | null
  if (!m) return null
  return {
    id: resourceId,
    imageUrl: m.imageUrl || '',
    description: m.description || '',
    fileUrl: m.fileUrl || '',
    date: m.date || '',
    favoritedAt: new Date().toISOString(),
  }
}

export async function toggleImageDuJourFavorite(
  userId: string,
  docId: string,
  action?: 'add' | 'remove',
  meta?: ImageDuJourFavoriteMeta,
) {
  return toggleFavorite(userId, TYPE, docId, action, meta as Record<string, unknown>)
}

export async function isImageDuJourFavorite(userId: string, docId: string): Promise<boolean> {
  return isFavorite(userId, TYPE, docId)
}

export async function getImageDuJourFavorites(userId: string): Promise<ImageDuJourFavoriteDoc[]> {
  const items = await getFavorites(userId, TYPE)
  return items
    .map((item) => mapMeta(item.meta, item.resourceId || ''))
    .filter((d): d is ImageDuJourFavoriteDoc => d !== null)
}

export async function getImageDuJourFavoritesCount(userId: string): Promise<number> {
  return getFavoritesCount(userId, TYPE)
}
