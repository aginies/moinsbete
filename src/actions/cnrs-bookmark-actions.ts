'use server'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { toggleCnrsFavorite, getCnrsFavorites, isCnrsFavorite, type CnrsFavoriteMeta } from '@/lib/cnrs-bookmark'

export async function toggleCnrsFavoriteAction(articleId: string, action?: 'add' | 'remove', meta?: CnrsFavoriteMeta) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { error: 'Non authentifié' }
  }

  const result = await toggleCnrsFavorite(session.user.id, articleId, action, meta)
  return result
}

export async function getCnrsFavoritesAction() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { favorites: [] }
  }

  const favorites = await getCnrsFavorites(session.user.id)
  return { favorites }
}

export async function isCnrsFavoriteAction(articleId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { isFavorite: false }
  }

  const favorite = await isCnrsFavorite(session.user.id, articleId)
  return { isFavorite: favorite }
}
