'use server'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { toggleBookmark, isBookmarked, getBookmarks } from '@/lib/favorite'
import type { BookmarkType } from '@/generated/client'

export async function toggleBookmarkAction(
  type: BookmarkType,
  resourceId: string,
  action?: 'add' | 'remove',
  meta?: Record<string, unknown>,
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { error: 'Non authentifié' }
  return await toggleBookmark(session.user.id, type, resourceId, action, meta)
}

export async function getBookmarksAction(type: BookmarkType) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { favorites: [] }
  return { favorites: await getBookmarks(session.user.id, type) }
}

export async function isBookmarkedAction(type: BookmarkType, resourceId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { isBookmarked: false }
  return { isBookmarked: await isBookmarked(session.user.id, type, resourceId) }
}

export interface BookmarkItemResult {
  id: string
  resourceId: string | null
  type: BookmarkType
  meta: unknown
  createdAt: string
}

export async function getBookmarksRawAction(type: BookmarkType) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { favorites: [] }
  const items = await getBookmarks(session.user.id, type)
  return { favorites: items.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() })) }
}
