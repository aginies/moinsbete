import type { BookmarkType } from '@/generated/client'
import { createBookmarkManager } from '@/lib/bookmark-manager'

export interface WikiLovesImageFavoriteMeta {
  titre?: string
  auteur?: string
  imageUrl?: string
  link?: string
  droits?: string
}

export interface WikiLovesImageFavoriteDoc {
  id: string
  docid: string
  titre: string
  auteur: string
  imageUrl: string
  link: string
  droits: string
  favoritedAt: string
}

export const WIKILOVES_TYPE: BookmarkType = 'IMAGE_WIKILOVES'

export const wikilovesManager = createBookmarkManager(WIKILOVES_TYPE, (meta, resourceId) => {
  const m = meta as WikiLovesImageFavoriteMeta | null
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

export const getWikiLovesFavorites = wikilovesManager.getFavorites.bind(wikilovesManager)
export const getWikiLovesFavoritesCount = wikilovesManager.getFavoritesCount.bind(wikilovesManager)
