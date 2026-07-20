import type { BookmarkType } from '@/generated/client'
import { createBookmarkManager } from '@/lib/bookmark-manager'

export interface PixabayVideoFavoriteMeta {
  pageURL: string
  author: string
  authorProfileUrl: string
  duration: number
  thumbnailUrl: string
  videoUrl: string
  tags: string
}

export interface PixabayVideoFavoriteDoc {
  id: string
  docid: string
  pageURL: string
  author: string
  authorProfileUrl: string
  duration: number
  thumbnailUrl: string
  videoUrl: string
  tags: string
  favoritedAt: string
}

export const IMAGE_PIXABAY_TYPE: BookmarkType = 'IMAGE_PIXABAY'

export const pixabayManager = createBookmarkManager(IMAGE_PIXABAY_TYPE, (meta, resourceId) => {
  const m = meta as PixabayVideoFavoriteMeta | null
  if (!m) return null
  return {
    id: resourceId,
    docid: String(resourceId),
    pageURL: m.pageURL,
    author: m.author || '',
    authorProfileUrl: m.authorProfileUrl || '',
    duration: m.duration || 0,
    thumbnailUrl: m.thumbnailUrl || '',
    videoUrl: m.videoUrl || '',
    tags: m.tags || '',
    favoritedAt: new Date().toISOString(),
  }
})

export const getPixabayFavorites = pixabayManager.getFavorites.bind(pixabayManager)
export const getPixabayFavoritesCount = pixabayManager.getFavoritesCount.bind(pixabayManager)
