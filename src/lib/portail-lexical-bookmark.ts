import type { BookmarkType } from '@/generated/client'
import type { PortailLexicalFavoriteDoc } from '@/app/(main)/favoris/portail-lexical-bookmarks'
import { createBookmarkManager } from '@/lib/bookmark-manager'

export interface PortailLexicalFavoriteMeta {
  form?: string
  pos?: string
  full_pos?: string
  description?: string
  ipa?: string
}

export const PORTAIL_LEXICAL_TYPE: BookmarkType = 'PORTAIL_LEXICAL'

export const portailLexicalManager = createBookmarkManager(PORTAIL_LEXICAL_TYPE, (meta, resourceId) => {
  const m = meta as PortailLexicalFavoriteMeta | null
  if (!m) return null
  return {
    id: resourceId,
    form: resourceId,
    pos: m.pos || '',
    full_pos: m.full_pos || '',
    description: m.description || '',
    ipa: m.ipa || '',
    favoritedAt: new Date().toISOString(),
  }
})

export const getPortailLexicalFavorites = portailLexicalManager.getFavorites.bind(portailLexicalManager)
export const getPortailLexicalFavoritesCount = portailLexicalManager.getFavoritesCount.bind(portailLexicalManager)
