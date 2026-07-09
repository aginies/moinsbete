'use server'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import type { BookmarkType } from '@/generated/client'
import { toggleFavoriteAction, isFavoriteAction } from '@/actions/favorite-actions'
import { getCnrsFavorites } from '@/lib/cnrs-bookmark'
import type { CnrsFavoriteMeta } from '@/lib/cnrs-bookmark'

const TYPE: BookmarkType = 'CNRS_NEWS'

export async function toggleCnrsFavoriteAction(articleId: string, action?: 'add' | 'remove', meta?: CnrsFavoriteMeta) {
  return toggleFavoriteAction(TYPE, articleId, action, meta as Record<string, unknown>)
}

export async function getCnrsFavoritesAction() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { favorites: [] }
  return { favorites: await getCnrsFavorites(session.user.id) }
}

export async function isCnrsFavoriteAction(articleId: string) {
  return isFavoriteAction(TYPE, articleId)
}
