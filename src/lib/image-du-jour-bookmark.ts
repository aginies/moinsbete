import type { BookmarkType } from '@/generated/client'
import type { ImageDuJourFavoriteDoc } from '@/components/feed/image-du-jour-bookmarks'
import { createBookmarkManager } from '@/lib/bookmark-manager'

export interface ImageDuJourFavoriteMeta {
  imageUrl?: string
  description?: string
  fileUrl?: string
  date?: string
}

const TYPE: BookmarkType = 'IMAGE_DU_JOUR'

const mapMeta: (meta: unknown, resourceId: string) => ImageDuJourFavoriteDoc | null = (meta, resourceId) => {
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

export const imageDuJourManager = createBookmarkManager(TYPE, mapMeta)

export const getImageDuJourFavorites = imageDuJourManager.getFavorites.bind(imageDuJourManager)
export const getImageDuJourFavoritesCount = imageDuJourManager.getFavoritesCount.bind(imageDuJourManager)
