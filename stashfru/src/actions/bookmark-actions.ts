'use server'


import { prisma } from '@/lib/db'
import { decode } from 'next-auth/jwt'
import { cookies } from 'next/headers'

async function getSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('next-auth.session-token')
  if (!sessionCookie) return null

  const secret = process.env.NEXTAUTH_SECRET || 'stashfru-secret-change-in-production'
  const token = await decode({
    token: sessionCookie.value,
    secret,
  })

  if (!token?.sub) return null

  return {
    user: {
      id: token.sub,
      email: token.email as string,
      name: token.name as string,
    },
  }
}

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
    return { error: 'Non authentifié' }
  }

  try {
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_ideaId: {
          userId: session.user.id,
          ideaId,
        },
      },
    })

    if (existing) {
      await prisma.bookmark.delete({
        where: {
          userId_ideaId: {
            userId: session.user.id,
            ideaId,
          },
        },
      })
      return { success: true, wasBookmarked: true }
    } else {
      await prisma.bookmark.create({
        data: {
          userId: session.user.id,
          ideaId,
        },
      })
      return { success: true, wasBookmarked: false }
    }
  } catch {
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
