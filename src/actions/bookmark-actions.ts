'use server'


import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function bookmarkAction(ideaId: string, action: 'add' | 'remove') {
  const session = await getSession()
  if (!session?.user) {
    return { error: 'Non authentifié' }
  }

  try {
    if (action === 'add') {
      await prisma.bookmark.create({
        data: {
          userId: session.user.id,
          ideaId,
        },
      })
    } else {
      await prisma.bookmark.delete({
        where: {
          userId_ideaId: {
            userId: session.user.id,
            ideaId,
          },
        },
      })
    }

    return { success: true }
  } catch {
    return { error: 'Erreur lors de la sauvegarde' }
  }
}

export async function toggleBookmarkAction(ideaId: string) {
  const session = await getSession()
  if (!session?.user) {
    console.error('[toggleBookmark] No session, user:', session)
    return { error: 'Non authentifié' }
  }

  console.log('[toggleBookmark] userId:', session.user.id, 'ideaId:', ideaId)

  try {
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_ideaId: {
          userId: session.user.id,
          ideaId,
        },
      },
    })

    console.log('[toggleBookmark] existing bookmark:', existing ? 'YES' : 'NO')

    if (existing) {
      await prisma.bookmark.delete({
        where: {
          id: existing.id,
        },
      })
      console.log('[toggleBookmark] deleted bookmark id:', existing.id)
      return { success: true, wasBookmarked: true }
    } else {
      const newBookmark = await prisma.bookmark.create({
        data: {
          userId: session.user.id,
          ideaId,
        },
      })
      console.log('[toggleBookmark] created bookmark id:', newBookmark.id)
      return { success: true, wasBookmarked: false }
    }
  } catch (err) {
    console.error('[toggleBookmark] error:', err)
    return { error: 'Erreur lors de la sauvegarde' }
  }
}

export async function getSavedIdeas() {
  const session = await getSession()
  if (!session?.user) {
    return { ideas: [] }
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
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
    orderBy: { createdAt: 'desc' },
  })

  return {
    ideas: bookmarks.map(b => ({
      ...b.idea,
      topics: b.idea.ideaTopics.map(it => it.topic),
    })),
    count: bookmarks.length,
  }
}

export async function followTopic(topicId: string) {
  const session = await getSession()
  if (!session?.user) {
    return { error: 'Non authentifié' }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      following: {
        connect: { id: topicId },
      },
    },
  })

  return { success: true }
}

export async function getFollowedTopics() {
  const session = await getSession()
  if (!session?.user) {
    return { topics: [] }
  }

  const topics = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { following: true },
  })

  return { topics: topics?.following || [] }
}
