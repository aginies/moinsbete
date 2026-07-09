import { prisma } from '@/lib/db'
import type { BookmarkType } from '@/generated/client'

export interface FavoriteItem {
  id: string
  resourceId: string | null
  type: BookmarkType
  meta: unknown
  createdAt: Date
}

export interface FavoriteResult {
  bookmarked: boolean
  wasBookmarked: boolean
}

export async function toggleFavorite(
  userId: string,
  type: BookmarkType,
  resourceId: string,
  action?: 'add' | 'remove',
  meta?: Record<string, unknown>,
): Promise<FavoriteResult> {
  const existing = await prisma.bookmark.findFirst({
    where: { userId, resourceId, type },
  })

  if (existing) {
    if (action === 'add') return { bookmarked: false, wasBookmarked: true }
    await prisma.bookmark.delete({ where: { id: existing.id } })
    return { bookmarked: false, wasBookmarked: true }
  }

  if (action === 'remove') return { bookmarked: true, wasBookmarked: false }

  await prisma.bookmark.create({
    data: { userId, resourceId, type, meta: meta as any },
  })
  return { bookmarked: true, wasBookmarked: false }
}

export async function isFavorite(userId: string, type: BookmarkType, resourceId: string): Promise<boolean> {
  const existing = await prisma.bookmark.findFirst({
    where: { userId, resourceId, type },
  })
  return !!existing
}

export async function getFavorites(userId: string, type: BookmarkType): Promise<FavoriteItem[]> {
  return prisma.bookmark.findMany({
    where: { userId, type },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      resourceId: true,
      type: true,
      meta: true,
      createdAt: true,
    },
  })
}

export async function getFavoritesCount(userId: string, type: BookmarkType): Promise<number> {
  return prisma.bookmark.count({ where: { userId, type } })
}
