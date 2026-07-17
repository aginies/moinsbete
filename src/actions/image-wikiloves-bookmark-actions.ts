'use server'

import type { BookmarkType } from '@/generated/client'
import { toggleBookmarkAction, isBookmarkedAction } from '@/actions/favorite-actions'
import { wikilovesManager } from '@/lib/image-wikiloves-bookmark'
import { createBookmarkManagerActions } from '@/actions/bookmark-manager'
import type { WikiLovesImageFavoriteMeta } from '@/lib/image-wikiloves-bookmark'

const TYPE: BookmarkType = 'IMAGE_WIKILOVES'

const wikilovesActions = createBookmarkManagerActions(wikilovesManager)

export async function toggleWikiLovesFavoriteAction(docId: string, action?: 'add' | 'remove', meta?: WikiLovesImageFavoriteMeta) {
  return toggleBookmarkAction(TYPE, docId, action, meta as Record<string, unknown>)
}

export async function getWikiLovesFavoritesAction() {
  return wikilovesActions.getFavorites()
}

export async function isWikiLovesFavoriteAction(docId: string) {
  return isBookmarkedAction(TYPE, docId)
}
