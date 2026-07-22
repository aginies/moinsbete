'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function cleanupExpiredCache() {
  const session = await getSession()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { error: 'Non autorisé', totalDeleted: 0 }
  }

  const now = new Date()

  const [cnrsDeleted, radioDeleted, wikiImageDeleted, wikiLovesDeleted] = await prisma.$transaction([
    prisma.cachedCnrsArticle.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.cachedRadioEpisode.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.cachedWikipediaImage.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.cachedWikiLovesImage.deleteMany({ where: { expiresAt: { lt: now } } }),
  ])

  return {
    cnrsDeleted,
    radioDeleted,
    wikiImageDeleted,
    wikiLovesDeleted,
    totalDeleted: cnrsDeleted.count + radioDeleted.count + wikiImageDeleted.count + wikiLovesDeleted.count,
  }
}

export async function clearAllBbcNewsAction() {
  const session = await getSession()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { error: 'Non autorisé', deletedCount: 0 }
  }

  const result = await prisma.cachedBbcArticle.deleteMany({})

  return { success: true, deletedCount: result.count }
}
