'use server'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { toggleFavorite, isFavorite, getFavorites } from '@/lib/favorite'
import type { BookmarkType } from '@/generated/client'

export async function toggleFavoriteAction(
  type: BookmarkType,
  resourceId: string,
  action?: 'add' | 'remove',
  meta?: Record<string, unknown>,
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { error: 'Non authentifié' }
  return await toggleFavorite(session.user.id, type, resourceId, action, meta)
}

export async function getFavoritesAction(type: BookmarkType) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { favorites: [] }
  return { favorites: await getFavorites(session.user.id, type) }
}

export async function isFavoriteAction(type: BookmarkType, resourceId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { isFavorite: false }
  return { isFavorite: await isFavorite(session.user.id, type, resourceId) }
}

export interface FavoriteItemResult {
  id: string
  resourceId: string | null
  type: BookmarkType
  meta: unknown
  createdAt: string
}

export async function getFavoritesRawAction(type: BookmarkType) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { favorites: [] }
  const items = await getFavorites(session.user.id, type)
  return { favorites: items.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() })) }
}
