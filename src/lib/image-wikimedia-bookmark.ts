import type { BookmarkType } from '@/generated/client'
import { createBookmarkManager } from '@/lib/bookmark-manager'

export interface WikimediaImageFavoriteMeta {
  titre?: string
  auteur?: string
  imageUrl?: string
  link?: string
  droits?: string
}

export interface WikimediaImageFavoriteDoc {
  id: string
  docid: string
  titre: string
  auteur: string
  imageUrl: string
  link: string
  droits: string
  favoritedAt: string
}

export const WIKIMEDIA_TYPE: BookmarkType = 'IMAGE_WIKIMEDIA'

export const wikimediaManager = createBookmarkManager(WIKIMEDIA_TYPE, (meta, resourceId) => {
  const m = meta as WikimediaImageFavoriteMeta | null
  if (!m) return null
  return {
    id: resourceId,
    docid: resourceId,
    titre: m.titre || '',
    auteur: m.auteur || '',
    imageUrl: m.imageUrl || '',
    link: m.link || '',
    droits: m.droits || '',
    favoritedAt: new Date().toISOString(),
  }
})

export const getWikimediaFavorites = wikimediaManager.getFavorites.bind(wikimediaManager)
export const getWikimediaFavoritesCount = wikimediaManager.getFavoritesCount.bind(wikimediaManager)
