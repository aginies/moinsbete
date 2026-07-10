'use server'

import type { BookmarkType } from '@/generated/client'
import { toggleBookmarkAction, isBookmarkedAction } from '@/actions/favorite-actions'
import { bnfGallicaManager } from '@/lib/bnf-gallica-bookmark'
import { createBookmarkManagerActions } from '@/actions/bookmark-manager'
import type { BnFGallicaFavoriteMeta } from '@/lib/bnf-gallica-bookmark'

const TYPE: BookmarkType = 'BNF_GALICA'

const bnfActions = createBookmarkManagerActions(bnfGallicaManager)

export async function toggleBnFGallicaFavoriteAction(docId: string, action?: 'add' | 'remove', meta?: BnFGallicaFavoriteMeta) {
  return toggleBookmarkAction(TYPE, docId, action, meta as Record<string, unknown>)
}

export async function getBnFGallicaFavoritesAction() {
  return bnfActions.getFavorites()
}

export async function isBnFGallicaFavoriteAction(docId: string) {
  return isBookmarkedAction(TYPE, docId)
}
