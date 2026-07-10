'use server'

import type { BookmarkType } from '@/generated/client'
import { toggleBookmarkAction, isBookmarkedAction } from '@/actions/favorite-actions'
import { saviezVousManager } from '@/lib/saviez-vous-bookmark'
import { createBookmarkManagerActions } from '@/actions/bookmark-manager'
import type { SaviezVousFavoriteMeta } from '@/lib/saviez-vous-bookmark'

const TYPE: BookmarkType = 'SAVIEZ_VOUS'

const saviezVousActions = createBookmarkManagerActions(saviezVousManager)

export async function toggleSaviezVousFavoriteAction(factId: string, action?: 'add' | 'remove', meta?: SaviezVousFavoriteMeta) {
  return toggleBookmarkAction(TYPE, factId, action, meta as Record<string, unknown>)
}

export async function getSaviezVousFavoritesAction() {
  return saviezVousActions.getFavorites()
}

export async function isSaviezVousFavoriteAction(factId: string) {
  return isBookmarkedAction(TYPE, factId)
}
