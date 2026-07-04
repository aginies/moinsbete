'use server'

import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { markIdeaViewed } from '@/lib/view'

async function getSession() {
  return await getServerSession(authOptions)
}

export async function markIdeaViewedAction(ideaId: string, userId: string) {
  const session = await getSession()
  if (!session?.user || session.user.id !== userId) {
    throw new Error('Non autorisé')
  }

  await prisma.user.findUnique({ where: { id: userId } }).then(user => {
    if (!user) throw new Error(`User not found: ${userId}`)
  })

  await markIdeaViewed(userId, ideaId)
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
