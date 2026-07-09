import { prisma } from '@/lib/db'

const today = new Date()
today.setHours(0, 0, 0, 0)
const yesterday = new Date(today)
yesterday.setDate(yesterday.getDate() - 1)

export async function markIdeaViewed(userId: string, ideaId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.viewedIdea.upsert({
      where: { userId_ideaId: { userId, ideaId } },
      create: { userId, ideaId },
      update: {},
    })

    const existing = await tx.growthPlan.findUnique({ where: { userId } })

    let newStreak: number
    if (existing?.lastActiveDate && existing.lastActiveDate >= yesterday && existing.lastActiveDate < today) {
      newStreak = (existing.streakDays || 0) + 1
    } else {
      newStreak = 1
    }

    await tx.growthPlan.upsert({
      where: { userId },
      create: { userId, streakDays: 1, lastActiveDate: today },
      update: { streakDays: newStreak, lastActiveDate: today },
    })
  })
}
