'use server'

import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { markIdeaViewed } from '@/lib/view'

export async function markIdeaViewedAction(ideaId: string, userId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.id !== userId) {
    throw new Error('Non autorisé')
  }

  await markIdeaViewed(userId, ideaId)
}

export async function clearHistoryAction(userId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.id !== userId) {
    throw new Error('Non autorisé')
  }

  await prisma.viewedIdea.deleteMany({
    where: { userId },
  })
}

export async function removeFromHistoryAction(viewedIdeaId: string, userId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.id !== userId) {
    throw new Error('Non autorisé')
  }

  await prisma.viewedIdea.delete({
    where: { id: viewedIdeaId, userId },
  })
}
