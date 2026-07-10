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

const TYPE: BookmarkType = 'BNF_GALICA'

const mapMeta: (meta: unknown, resourceId: string) => WikimediaImageFavoriteDoc | null = (meta, resourceId) => {
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
}

export const wikimediaManager = createBookmarkManager(TYPE, mapMeta)
export const getWikimediaFavorites = wikimediaManager.getFavorites.bind(wikimediaManager)
export const getWikimediaFavoritesCount = wikimediaManager.getFavoritesCount.bind(wikimediaManager)
