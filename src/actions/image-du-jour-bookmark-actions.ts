'use server'

import type { BookmarkType } from '@/generated/client'
import { toggleBookmarkAction, isBookmarkedAction } from '@/actions/favorite-actions'
import { imageDuJourManager } from '@/lib/image-du-jour-bookmark'
import { createBookmarkManagerActions } from '@/actions/bookmark-manager'
import type { ImageDuJourFavoriteMeta } from '@/lib/image-du-jour-bookmark'

const TYPE: BookmarkType = 'IMAGE_DU_JOUR'

export const imageDuJourActions = createBookmarkManagerActions(imageDuJourManager)

export async function toggleImageDuJourFavoriteAction(docId: string, action?: 'add' | 'remove', meta?: ImageDuJourFavoriteMeta) {
  return toggleBookmarkAction(TYPE, docId, action, meta as Record<string, unknown>)
}

export async function getImageDuJourFavoritesAction() {
  return imageDuJourActions.getFavorites()
}

export async function isImageDuJourFavoriteAction(docId: string) {
  return isBookmarkedAction(TYPE, docId)
}
