import { prisma } from '@/lib/db'

export interface CnrsFavoriteMeta {
  title?: string
  category?: string
  imageUrl?: string
  link?: string
  date?: string
}

export interface CnrsFavoriteDoc {
  id: string
  title: string
  category: string
  imageUrl: string | undefined
  link: string
  date: string
  favoritedAt: string
}

export async function toggleCnrsFavorite(userId: string, articleId: string, action?: 'add' | 'remove', meta?: CnrsFavoriteMeta) {
  const existing = await prisma.bookmark.findFirst({
    where: { userId, resourceId: articleId, type: 'CNRS_NEWS' },
  })

  if (existing) {
    if (action === 'add') return { bookmarked: false, wasBookmarked: true }
    await prisma.bookmark.delete({ where: { id: existing.id } })
    return { bookmarked: false, wasBookmarked: true }
  }

  if (action === 'remove') return { bookmarked: true, wasBookmarked: false }

  await prisma.bookmark.create({
    data: {
      userId,
      resourceId: articleId,
      type: 'CNRS_NEWS',
      meta: meta as any,
    },
  })
  return { bookmarked: true, wasBookmarked: false }
}

export async function isCnrsFavorite(userId: string, articleId: string): Promise<boolean> {
  const existing = await prisma.bookmark.findFirst({
    where: { userId, resourceId: articleId, type: 'CNRS_NEWS' },
  })
  return !!existing
}

export async function getCnrsFavorites(userId: string): Promise<CnrsFavoriteDoc[]> {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId, type: 'CNRS_NEWS' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      resourceId: true,
      meta: true,
      createdAt: true,
    },
  })

  return bookmarks.map((b) => ({
    id: b.resourceId || '',
    title: (b.meta as CnrsFavoriteMeta | null)?.title || b.resourceId || '',
    category: (b.meta as CnrsFavoriteMeta | null)?.category || '',
    imageUrl: (b.meta as CnrsFavoriteMeta | null)?.imageUrl,
    link: (b.meta as CnrsFavoriteMeta | null)?.link || '',
    date: (b.meta as CnrsFavoriteMeta | null)?.date || '',
    favoritedAt: b.createdAt.toISOString(),
  }))
}

export async function getCnrsFavoritesCount(userId: string): Promise<number> {
  return prisma.bookmark.count({
    where: { userId, type: 'CNRS_NEWS' },
  })
}
