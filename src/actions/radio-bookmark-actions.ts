'use server'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import type { BookmarkType } from '@/generated/client'
import { toggleBookmarkAction, isBookmarkedAction } from '@/actions/favorite-actions'
import { getRadioFavorites } from '@/lib/radio-bookmark'
import type { RadioFavoriteMeta } from '@/lib/radio-bookmark'

const TYPE: BookmarkType = 'RADIO_FRANCE'

export async function toggleRadioFavoriteAction(docId: string, action?: 'add' | 'remove', meta?: RadioFavoriteMeta) {
  return toggleBookmarkAction(TYPE, docId, action, meta as Record<string, unknown>)
}

export async function getRadioFavoritesAction() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { favorites: [] }
  return { favorites: await getRadioFavorites(session.user.id) }
}

export async function isRadioFavoriteAction(docId: string) {
  return isBookmarkedAction(TYPE, docId)
}
