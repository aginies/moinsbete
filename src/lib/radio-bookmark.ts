import { prisma } from '@/lib/db'
import type { FavoriteDoc } from '@/app/(main)/favoris/radio-france-favorites'

export async function toggleRadioFavorite(userId: string, docId: string, action?: 'add' | 'remove') {
  const existing = await prisma.bookmark.findFirst({
    where: { userId, resourceId: docId, type: 'RADIO_FRANCE' },
  })

  if (existing) {
    if (action === 'add') return { bookmarked: false, wasBookmarked: true }
    await prisma.bookmark.delete({ where: { id: existing.id } })
    return { bookmarked: false, wasBookmarked: true }
  }

  if (action === 'remove') return { bookmarked: true, wasBookmarked: false }

  await prisma.bookmark.create({
    data: { userId, resourceId: docId, type: 'RADIO_FRANCE' },
  })
  return { bookmarked: true, wasBookmarked: false }
}

export async function isRadioFavorite(userId: string, docId: string): Promise<boolean> {
  const existing = await prisma.bookmark.findFirst({
    where: { userId, resourceId: docId, type: 'RADIO_FRANCE' },
  })
  return !!existing
}

export async function getRadioFavorites(userId: string): Promise<FavoriteDoc[]> {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId, type: 'RADIO_FRANCE' },
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
    title: (b.meta as { title?: string } | null)?.title || b.resourceId || '',
    description: (b.meta as { description?: string } | null)?.description || '',
    url: (b.meta as { url?: string } | null)?.url || '',
    radio: (b.meta as { radio?: string } | null)?.radio || '',
    section: (b.meta as { section?: string } | null)?.section || '',
    image: (b.meta as { image?: string } | null)?.image,
    favoritedAt: b.createdAt.toISOString(),
  }))
}

export async function getRadioFavoritesCount(userId: string): Promise<number> {
  return prisma.bookmark.count({
    where: { userId, type: 'RADIO_FRANCE' },
  })
}
