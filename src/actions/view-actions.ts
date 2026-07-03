'use server'

import { prisma } from '@/lib/db'

export async function markIdeaViewed(ideaId: string, userId: string) {
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
  await prisma.viewedIdea.deleteMany({
    where: { userId },
  })
}
