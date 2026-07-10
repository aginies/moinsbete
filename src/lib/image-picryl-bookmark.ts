import type { BookmarkType } from '@/generated/client'
import { createBookmarkManager } from '@/lib/bookmark-manager'

export interface ImagePicrylFavoriteMeta {
  titre?: string
  auteur?: string
  imageUrl?: string
  link?: string
  droits?: string
}

export interface ImagePicrylFavoriteDoc {
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

const mapMeta: (meta: unknown, resourceId: string) => ImagePicrylFavoriteDoc | null = (meta, resourceId) => {
  const m = meta as ImagePicrylFavoriteMeta | null
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

export const picrylManager = createBookmarkManager(TYPE, mapMeta)
export const getPicrylFavorites = picrylManager.getFavorites.bind(picrylManager)
export const getPicrylFavoritesCount = picrylManager.getFavoritesCount.bind(picrylManager)
