import type { BookmarkType } from '@/generated/client'
import { createBookmarkManager } from '@/lib/bookmark-manager'

export interface ImageDuJourFavoriteMeta {
  imageUrl?: string
  description?: string
  fileUrl?: string
  date?: string
}

export const IMAGE_DU_JOUR_TYPE: BookmarkType = 'IMAGE_DU_JOUR'

export const imageDuJourManager = createBookmarkManager(IMAGE_DU_JOUR_TYPE, (meta, resourceId) => {
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
})

export const getImageDuJourFavorites = imageDuJourManager.getFavorites.bind(imageDuJourManager)
export const getImageDuJourFavoritesCount = imageDuJourManager.getFavoritesCount.bind(imageDuJourManager)
