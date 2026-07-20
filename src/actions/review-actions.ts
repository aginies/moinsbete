'use server'

import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { calculateNextReview, getInitialNextReviewAt, type SrsRating } from '@/lib/srs'

export interface DueIdea {
  id: string
  title: string
  content: string
  takeaway: string
  slug: string
  topics: { name: string; slug: string; icon: string; color: string; id: string }[]
  source: { title: string; type: string }
  bookmark: {
    id: string
    lastReviewAt: Date | null
    nextReviewAt: Date | null
    reviewCount: number
    easeFactor: number
  }
}

export async function fetchDueIdeas(page: number = 1, pageSize: number = 10): Promise<{ ideas: DueIdea[]; total: number; hasMore: boolean }> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { ideas: [], total: 0, hasMore: false }
  }

  const now = new Date()
  const skip = (page - 1) * pageSize

  const [bookmarks, total] = await Promise.all([
    prisma.bookmark.findMany({
      where: {
        userId: session.user.id,
        type: 'IDEA',
        ideaId: { not: null },
        OR: [
          { nextReviewAt: null },
          { nextReviewAt: { lte: now } },
        ],
      },
      include: {
        idea: {
          include: {
            ideaTopics: {
              select: { topic: { select: { name: true, slug: true, icon: true, color: true, id: true } } },
            },
            source: { select: { title: true, type: true } },
          },
        },
      },
      orderBy: { nextReviewAt: 'asc' },
      skip,
      take: pageSize + 1,
    }),
    prisma.bookmark.count({
      where: {
        userId: session.user.id,
        type: 'IDEA',
        ideaId: { not: null },
        OR: [
          { nextReviewAt: null },
          { nextReviewAt: { lte: now } },
        ],
      },
    }),
  ])

  const hasMore = bookmarks.length > pageSize
  const ideas = bookmarks.slice(0, pageSize).map(b => ({
    id: b.idea!.id,
    title: b.idea!.title,
    content: b.idea!.content,
    takeaway: b.idea!.takeaway,
    slug: b.idea!.slug,
    topics: b.idea!.ideaTopics.map(t => ({
      name: t.topic.name,
      slug: t.topic.slug,
      icon: t.topic.icon,
      color: t.topic.color,
      id: t.topic.id,
    })),
    source: {
      title: b.idea!.source.title,
      type: b.idea!.source.type,
    },
    bookmark: {
      id: b.id,
      lastReviewAt: b.lastReviewAt,
      nextReviewAt: b.nextReviewAt,
      reviewCount: b.reviewCount,
      easeFactor: b.easeFactor,
    },
  }))

  return { ideas, total, hasMore }
}

export async function recordReview(bookmarkId: string, rating: SrsRating) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { error: 'Non authentifié' }
  }

  try {
    const bookmark = await prisma.bookmark.findUnique({
      where: { id: bookmarkId },
    })

    if (!bookmark) {
      return { error: 'Signet non trouvé' }
    }

    const { nextReviewAt, newEaseFactor, newReviewCount } = calculateNextReview(
      bookmark.easeFactor,
      rating,
      bookmark.lastReviewAt,
      bookmark.reviewCount,
    )

    await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: {
        lastReviewAt: new Date(),
        nextReviewAt,
        reviewCount: newReviewCount,
        easeFactor: newEaseFactor,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('[recordReview] Error:', error)
    return { error: 'Erreur lors de l\'enregistrement' }
  }
}

export async function skipIdea(bookmarkId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { error: 'Non authentifié' }
  }

  try {
    await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: {
        nextReviewAt: getInitialNextReviewAt(),
      },
    })

    return { success: true }
  } catch (error) {
    console.error('[skipIdea] Error:', error)
    return { error: 'Erreur lors du saut' }
  }
}

export async function removeFromSrs(bookmarkId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { error: 'Non authentifié' }
  }

  try {
    await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: {
        nextReviewAt: new Date('9999-12-31T00:00:00Z'),
      },
    })

    return { success: true }
  } catch (error) {
    console.error('[removeFromSrs] Error:', error)
    return { error: 'Erreur lors du retrait' }
  }
}
