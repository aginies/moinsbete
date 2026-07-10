'use server'

import type { BookmarkType } from '@/generated/client'
import { toggleBookmarkAction, isBookmarkedAction } from '@/actions/favorite-actions'
import { radioManager } from '@/lib/radio-bookmark'
import { createBookmarkManagerActions } from '@/actions/bookmark-manager'
import type { RadioFavoriteMeta } from '@/lib/radio-bookmark'

const TYPE: BookmarkType = 'RADIO_FRANCE'

export const radioActions = createBookmarkManagerActions(radioManager)

export async function toggleRadioFavoriteAction(docId: string, action?: 'add' | 'remove', meta?: RadioFavoriteMeta) {
  return toggleBookmarkAction(TYPE, docId, action, meta as Record<string, unknown>)
}

export async function getRadioFavoritesAction() {
  return radioActions.getFavorites()
}

export async function isRadioFavoriteAction(docId: string) {
  return isBookmarkedAction(TYPE, docId)
}
