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

export async function cleanupSaviezVousFacts() {
  const sharedBookmarks = await prisma.sharedLobbyBookmark.findMany({
    where: { resourceType: 'SAVIEZ_VOUS', resourceId: { not: null } },
    select: { resourceId: true },
  })

  const sharedResourceIds = new Set(sharedBookmarks.map(b => b.resourceId).filter((id): id is string => id !== null))

  const allFacts = await prisma.saviezVousFact.findMany({
    select: { id: true },
  })

  const orphanedFacts = allFacts.filter(f => !sharedResourceIds.has(f.id))

  const deleted = await prisma.saviezVousFact.deleteMany({
    where: { id: { in: orphanedFacts.map(f => f.id) } },
  })

  return {
    orphanedDeleted: deleted.count,
    totalFacts: allFacts.length,
    sharedFacts: sharedResourceIds.size,
  }
}

export async function getCleanupStats() {
  const [
    saviezVousTotal,
    saviezVousShared,
  ] = await Promise.all([
    prisma.saviezVousFact.count(),
    prisma.sharedLobbyBookmark.count({ where: { resourceType: 'SAVIEZ_VOUS', resourceId: { not: null } } }),
  ])

  return {
    saviezVousTotal,
    saviezVousShared,
    saviezVousOrphaned: saviezVousTotal - saviezVousShared,
  }
}
