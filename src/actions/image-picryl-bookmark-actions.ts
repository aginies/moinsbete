'use server'

import type { BookmarkType } from '@/generated/client'
import { toggleBookmarkAction, isBookmarkedAction } from '@/actions/favorite-actions'
import { picrylManager } from '@/lib/image-picryl-bookmark'
import { createBookmarkManagerActions } from '@/actions/bookmark-manager'
import type { ImagePicrylFavoriteMeta } from '@/lib/image-picryl-bookmark'

const TYPE: BookmarkType = 'BNF_GALICA'

const picrylActions = createBookmarkManagerActions(picrylManager)

export async function togglePicrylFavoriteAction(docId: string, action?: 'add' | 'remove', meta?: ImagePicrylFavoriteMeta) {
  return toggleBookmarkAction(TYPE, docId, action, meta as Record<string, unknown>)
}

export async function getPicrylFavoritesAction() {
  return picrylActions.getFavorites()
}

export async function isPicrylFavoriteAction(docId: string) {
  return isBookmarkedAction(TYPE, docId)
}
