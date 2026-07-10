'use server'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import type { BookmarkType } from '@/generated/client'
import { toggleBookmarkAction, isBookmarkedAction } from '@/actions/favorite-actions'
import { getImageDuJourFavorites } from '@/lib/image-du-jour-bookmark'
import type { ImageDuJourFavoriteMeta } from '@/lib/image-du-jour-bookmark'

const TYPE: BookmarkType = 'IMAGE_DU_JOUR'

export async function toggleImageDuJourFavoriteAction(docId: string, action?: 'add' | 'remove', meta?: ImageDuJourFavoriteMeta) {
  return toggleBookmarkAction(TYPE, docId, action, meta as Record<string, unknown>)
}

export async function getImageDuJourFavoritesAction() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { favorites: [] }
  return { favorites: await getImageDuJourFavorites(session.user.id) }
}

export async function isImageDuJourFavoriteAction(docId: string) {
  return isBookmarkedAction(TYPE, docId)
}
