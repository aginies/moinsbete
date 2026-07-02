'use server'

import { prisma } from '@/lib/db'

export async function markIdeaViewed(ideaId: string, userId: string) {
  await prisma.viewedIdea.upsert({
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
}

export async function clearHistoryAction(userId: string) {
  await prisma.viewedIdea.deleteMany({
    where: { userId },
  })
}
