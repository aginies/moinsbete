'use server'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { toggleRadioFavorite, getRadioFavorites, isRadioFavorite, type RadioFavoriteMeta } from '@/lib/radio-bookmark'

export async function toggleRadioFavoriteAction(docId: string, action?: 'add' | 'remove', meta?: RadioFavoriteMeta) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { error: 'Non authentifié' }
  }

  const result = await toggleRadioFavorite(session.user.id, docId, action, meta)
  return result
}

export async function getRadioFavoritesAction() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { favorites: [] }
  }

  const favorites = await getRadioFavorites(session.user.id)
  return { favorites }
}

export async function isRadioFavoriteAction(docId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { isFavorite: false }
  }

  const isFavorite = await isRadioFavorite(session.user.id, docId)
  return { isFavorite }
}
