'use server'

import type { BookmarkType } from '@/generated/client'
import { toggleBookmarkAction, isBookmarkedAction } from '@/actions/favorite-actions'
import { pixabayManager } from '@/lib/image-pixabay-bookmark'
import { createBookmarkManagerActions } from '@/actions/bookmark-manager'
import type { PixabayVideoFavoriteMeta } from '@/lib/image-pixabay-bookmark'

const TYPE: BookmarkType = 'IMAGE_PIXABAY'

const pixabayActions = createBookmarkManagerActions(pixabayManager)

export async function togglePixabayFavoriteAction(docId: string, action?: 'add' | 'remove', meta?: PixabayVideoFavoriteMeta) {
  return toggleBookmarkAction(TYPE, docId, action, meta as unknown as Record<string, unknown>)
}

export async function getPixabayFavoritesAction() {
  return pixabayActions.getFavorites()
}

export async function isPixabayFavoriteAction(docId: string) {
  return isBookmarkedAction(TYPE, docId)
}
