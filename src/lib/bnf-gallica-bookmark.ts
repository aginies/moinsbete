import type { BookmarkType } from '@/generated/client'
import { createBookmarkManager } from '@/lib/bookmark-manager'

export interface BnFGallicaFavoriteMeta {
  titre?: string
  auteur?: string
  imageUrl?: string
  link?: string
  droits?: string
}

export interface BnFGallicaFavoriteDoc {
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

const mapMeta: (meta: unknown, resourceId: string) => BnFGallicaFavoriteDoc | null = (meta, resourceId) => {
  const m = meta as BnFGallicaFavoriteMeta | null
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

export const bnfGallicaManager = createBookmarkManager(TYPE, mapMeta)
export const getBnFGallicaFavorites = bnfGallicaManager.getFavorites.bind(bnfGallicaManager)
export const getBnFGallicaFavoritesCount = bnfGallicaManager.getFavoritesCount.bind(bnfGallicaManager)
