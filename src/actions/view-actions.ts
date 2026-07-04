'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function markIdeaViewed(ideaId: string, userId: string) {
  const session = await getSession()
  if (!session?.user || session.user.id !== userId) {
    throw new Error('Non autorisé')
  }

  console.log('[markIdeaViewed] ideaId:', ideaId, 'userId:', userId)
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new Error(`User not found: ${userId}`)
    }
    const result = await prisma.viewedIdea.upsert({
      where: {
        userId_ideaId: {
          userId,
          ideaId,
        },
      },
      create: {
        userId,
        ideaId,
      },
      update: {},
    })
    console.log('[markIdeaViewed] success:', result.id)
  } catch (err) {
    console.error('[markIdeaViewed] error:', err)
    throw err
  }
}

export async function clearHistoryAction(userId: string) {
  const session = await getSession()
  if (!session?.user || session.user.id !== userId) {
    throw new Error('Non autorisé')
  }

  await prisma.viewedIdea.deleteMany({
    where: { userId },
  })
}
