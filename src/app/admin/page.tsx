import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AdminUser } from './admin-content'
import { CACHE_SOURCES } from '@/lib/admin-cache-config'
import { AdminContent } from './admin-content'

export default async function AdminPage() {
  const session = await getSession()
  if (!session?.user) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="mt-2 text-muted-foreground">Non authentifié</p>
          <Link href="/login">
            <Button className="mt-4">Se connecter</Button>
          </Link>
        </div>
      </div>
    )
  }
  if (session.user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="mt-2 text-muted-foreground">Accès réservé aux administrateurs</p>
        </div>
      </div>
    )
  }

  // Build dynamic SQL for cache total + expired counts
  const countSql = `SELECT\n        ${CACHE_SOURCES.map(s =>
    `(SELECT COUNT(*) FROM ${s.model}) as "${s.statsArticles}",\n        (SELECT COUNT(*) FROM ${s.model} WHERE datetime(expiresAt) < datetime('now')) as "${s.statsExpired}"`
  ).join(',\n        ')}`
  const cacheStats = await prisma.$queryRawUnsafe<Record<string, bigint>[]>(countSql)

  // Build dynamic SQL for latest scrapedAt per source
  const latestSql = `SELECT\n        ${CACHE_SOURCES.map(s =>
    `(SELECT scrapedAt FROM ${s.model} ORDER BY scrapedAt DESC LIMIT 1) as "${s.key}"`
  ).join(',\n        ')}`
  const latestRow = await prisma.$queryRawUnsafe<Record<string, Date | null>[]>(latestSql)

  const [ideaCount, topicCount, sourceCount, bookmarkCount, userCount, viewedIdeaCount, activeStreakCount, saviezVousCount, srsDueCount, proverbeRow, users, insoliteConfigCount, latestSaviezVous, airCrashAsnLinked] = await Promise.all([
    prisma.idea.count({ where: { isPublished: true } }),
    prisma.topic.count(),
    prisma.source.count(),
    prisma.bookmark.count(),
    prisma.user.count(),
    prisma.viewedIdea.count(),
    prisma.growthPlan.count({ where: { streakDays: { gt: 0 } } }),
    prisma.saviezVousFact.count(),
    prisma.bookmark.count({
      where: {
        type: 'IDEA',
        OR: [
          { nextReviewAt: null },
          { nextReviewAt: { lte: new Date() } },
        ],
      },
    }),
    prisma.cachedConfig.findUnique({ where: { key: 'proverbes_all' } }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        enabled: true,
        createdAt: true,
        lastLogin: true,
        lastVisited: true,
      },
    }),
    prisma.cachedConfig.count({ where: { key: { startsWith: 'insolite_' } } }),
    prisma.saviezVousFact.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
    prisma.cachedAirCrashArticle.count({ where: { asnId: { not: null } } }),
  ])

  const stats = cacheStats[0]
  const latest = latestRow[0] ?? {}

  const formatScrapedAt = (date: Date | string | bigint | null) => {
    if (!date) return null
    const d = typeof date === 'bigint' ? Number(date) : date
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const adminUsers = users as AdminUser[]

  // Build stats object from config
  const statsObj: Record<string, unknown> = {
    ideas: ideaCount,
    topics: topicCount,
    sources: sourceCount,
    bookmarks: bookmarkCount,
    users: userCount,
    viewedIdeas: viewedIdeaCount,
    activeStreaks: activeStreakCount,
    saviezVousFacts: saviezVousCount,
    saviezVousScrapedAt: formatScrapedAt(latestSaviezVous?.createdAt ?? null),
    srsDue: srsDueCount,
    proverbesCached: proverbeRow ? (() => { try { return JSON.parse(proverbeRow.value).length } catch { return 0 } })() : 0,
    insoliteConfigCount,
    airCrashAsnLinked,
  }

  for (const s of CACHE_SOURCES) {
    statsObj[s.statsArticles] = Number(stats[s.statsArticles])
    statsObj[s.statsExpired] = Number(stats[s.statsExpired])
    statsObj[s.statsScrapedAt] = formatScrapedAt(latest[s.key] ?? null)
  }

  return (
    <AdminContent
      stats={statsObj as any}
      users={adminUsers}
    />
  )
}
