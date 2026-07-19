'use server'

import type { BookmarkType } from '@/generated/client'
import { toggleBookmarkAction, isBookmarkedAction } from '@/actions/favorite-actions'
import { portailLexicalManager } from '@/lib/portail-lexical-bookmark'
import { createBookmarkManagerActions } from '@/actions/bookmark-manager'
import type { PortailLexicalFavoriteMeta } from '@/lib/portail-lexical-bookmark'

const TYPE: BookmarkType = 'PORTAIL_LEXICAL'

const portailLexicalActions = createBookmarkManagerActions(portailLexicalManager)

export async function togglePortailLexicalFavoriteAction(form: string, action?: 'add' | 'remove', meta?: PortailLexicalFavoriteMeta) {
  return toggleBookmarkAction(TYPE, form, action, meta as Record<string, unknown>)
}

export async function getPortailLexicalFavoritesAction() {
  return portailLexicalActions.getFavorites()
}

export async function isPortailLexicalFavoriteAction(form: string) {
  return isBookmarkedAction(TYPE, form)
}
