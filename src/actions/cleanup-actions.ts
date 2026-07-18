'use server'

import { prisma } from '@/lib/db'

export async function cleanupExpiredCache() {
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
