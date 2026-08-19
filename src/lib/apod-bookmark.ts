import type { BookmarkType } from '@/generated/client'
import { createBookmarkManager } from '@/lib/bookmark-manager'
import { apodPageUrl } from '@/lib/utils'

export interface ApodFavoriteDoc {
  id: string
  titre: string
  auteur: string
  imageUrl: string
  link: string
  droits: string
  description: string
  titreFr: string
  descriptionFr: string
  date: string
  favoritedAt: string
}

export interface ApodFavoriteMeta {
  titre?: string
  auteur?: string
  imageUrl?: string
  link?: string
  droits?: string
  description?: string
  titreFr?: string
  descriptionFr?: string
}

export const APOD_TYPE: BookmarkType = 'APOD'

export const apodManager = createBookmarkManager(APOD_TYPE, (meta, resourceId) => {
  const m = meta as ApodFavoriteMeta | null
  if (!m) return null
  return {
    id: resourceId,
    titre: m.titre || '',
    auteur: m.auteur || '',
    imageUrl: m.imageUrl || '',
    link: apodPageUrl(resourceId) || m.link || '',
    droits: m.droits || '',
    description: m.description || '',
    titreFr: m.titreFr || '',
    descriptionFr: m.descriptionFr || '',
    date: resourceId,
    favoritedAt: new Date().toISOString(),
  }
})

export const getApodFavorites = apodManager.getFavorites.bind(apodManager)
export const getApodFavoritesCount = apodManager.getFavoritesCount.bind(apodManager)
