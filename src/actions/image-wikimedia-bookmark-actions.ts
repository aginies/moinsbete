'use server'

import type { BookmarkType } from '@/generated/client'
import { toggleBookmarkAction, isBookmarkedAction } from '@/actions/favorite-actions'
import { wikimediaManager } from '@/lib/image-wikimedia-bookmark'
import { createBookmarkManagerActions } from '@/actions/bookmark-manager'
import type { WikimediaImageFavoriteMeta } from '@/lib/image-wikimedia-bookmark'

const TYPE: BookmarkType = 'IMAGE_WIKIMEDIA'

const wikimediaActions = createBookmarkManagerActions(wikimediaManager)

export async function toggleWikimediaFavoriteAction(docId: string, action?: 'add' | 'remove', meta?: WikimediaImageFavoriteMeta) {
  return toggleBookmarkAction(TYPE, docId, action, meta as Record<string, unknown>)
}

export async function getWikimediaFavoritesAction() {
  return wikimediaActions.getFavorites()
}

export async function isWikimediaFavoriteAction(docId: string) {
  return isBookmarkedAction(TYPE, docId)
}
