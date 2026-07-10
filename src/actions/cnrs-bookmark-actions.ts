'use server'

import type { BookmarkType } from '@/generated/client'
import { toggleBookmarkAction, isBookmarkedAction } from '@/actions/favorite-actions'
import { cnrsManager } from '@/lib/cnrs-bookmark'
import { createBookmarkManagerActions } from '@/actions/bookmark-manager'
import type { CnrsFavoriteMeta } from '@/lib/cnrs-bookmark'

const TYPE: BookmarkType = 'CNRS_NEWS'

const cnrsActions = createBookmarkManagerActions(cnrsManager)

export async function toggleCnrsFavoriteAction(articleId: string, action?: 'add' | 'remove', meta?: CnrsFavoriteMeta) {
  return toggleBookmarkAction(TYPE, articleId, action, meta as Record<string, unknown>)
}

export async function getCnrsFavoritesAction() {
  return cnrsActions.getFavorites()
}

export async function isCnrsFavoriteAction(articleId: string) {
  return isBookmarkedAction(TYPE, articleId)
}
