import { prisma } from '@/lib/db'

export async function toggleBookmark(userId: string, ideaId: string) {
  const existing = await prisma.bookmark.findUnique({
    where: { userId_ideaId: { userId, ideaId } },
  })
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } })
    return { bookmarked: false, wasBookmarked: true }
  }
  await prisma.bookmark.create({ data: { userId, ideaId } })
  return { bookmarked: true, wasBookmarked: false }
}
