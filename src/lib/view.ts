import { prisma } from '@/lib/db'

export async function markIdeaViewed(userId: string, ideaId: string) {
  await prisma.viewedIdea.upsert({
    where: { userId_ideaId: { userId, ideaId } },
    create: { userId, ideaId },
    update: {},
  })
}
