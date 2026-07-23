import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AdminUser } from './admin-content'

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
  const now = new Date()
  const [
    ideaCount,
    topicCount,
    sourceCount,
    bookmarkCount,
    userCount,
    viewedIdeaCount,
    activeStreakCount,
    cacheStats,
    saviezVousCount,
    srsDueCount,
    proverbeRow,
    users,
  ] = await Promise.all([
    prisma.idea.count({ where: { isPublished: true } }),
    prisma.topic.count(),
    prisma.source.count(),
    prisma.bookmark.count(),
    prisma.user.count(),
    prisma.viewedIdea.count(),
    prisma.growthPlan.count({ where: { streakDays: { gt: 0 } } }),
    prisma.$queryRaw<Array<{
      cnrsTotal: bigint
      cnrsExpired: bigint
      radioTotal: bigint
      radioExpired: bigint
      wikiImageTotal: bigint
      wikiImageExpired: bigint
      wikiLovesTotal: bigint
      wikiLovesExpired: bigint
      newsTotal: bigint
      newsExpired: bigint
    }>>`
      SELECT
        (SELECT COUNT(*) FROM CachedCnrsArticle) as cnrsTotal,
        (SELECT COUNT(*) FROM CachedCnrsArticle WHERE expiresAt < datetime('now')) as cnrsExpired,
        (SELECT COUNT(*) FROM CachedRadioEpisode) as radioTotal,
        (SELECT COUNT(*) FROM CachedRadioEpisode WHERE expiresAt < datetime('now')) as radioExpired,
        (SELECT COUNT(*) FROM CachedWikipediaImage) as wikiImageTotal,
        (SELECT COUNT(*) FROM CachedWikipediaImage WHERE expiresAt < datetime('now')) as wikiImageExpired,
        (SELECT COUNT(*) FROM CachedWikiLovesImage) as wikiLovesTotal,
        (SELECT COUNT(*) FROM CachedWikiLovesImage WHERE expiresAt < datetime('now')) as wikiLovesExpired,
        (SELECT COUNT(*) FROM CachedNewsArticle) as newsTotal,
        (SELECT COUNT(*) FROM CachedNewsArticle WHERE expiresAt < datetime('now')) as newsExpired
    `,
    prisma.saviezVousFact.count(),
    prisma.bookmark.count({
      where: {
        type: 'IDEA',
        OR: [
          { nextReviewAt: null },
          { nextReviewAt: { lte: now } },
        ],
      },
    }),
    prisma.cachedConfig.findUnique({ where: { key: 'proverbes_all' } }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
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
  ])

  const stats = cacheStats[0]
  const cnrsCount = Number(stats.cnrsTotal)
  const cnrsExpiredCount = Number(stats.cnrsExpired)
  const radioCount = Number(stats.radioTotal)
  const radioExpiredCount = Number(stats.radioExpired)
  const wikiImageCount = Number(stats.wikiImageTotal)
  const wikiImageExpiredCount = Number(stats.wikiImageExpired)
  const wikiLovesCount = Number(stats.wikiLovesTotal)
  const wikiLovesExpiredCount = Number(stats.wikiLovesExpired)
  const newsCount = Number(stats.newsTotal)
  const newsExpiredCount = Number(stats.newsExpired)

  const adminUsers = users as AdminUser[]

  return (
    <AdminContent
      stats={{
        ideas: ideaCount,
        topics: topicCount,
        sources: sourceCount,
        bookmarks: bookmarkCount,
        users: userCount,
        viewedIdeas: viewedIdeaCount,
        activeStreaks: activeStreakCount,
        cnrsArticles: cnrsCount,
        cnrsExpired: cnrsExpiredCount,
        radioEpisodes: radioCount,
        radioExpired: radioExpiredCount,
        wikiImages: wikiImageCount,
        wikiImageExpired: wikiImageExpiredCount,
        wikiLovesImages: wikiLovesCount,
        wikiLovesExpired: wikiLovesExpiredCount,
        saviezVousFacts: saviezVousCount,
        srsDue: srsDueCount,
        proverbesCached: proverbeRow ? (() => { try { return JSON.parse(proverbeRow.value).length } catch { return 0 } })() : 0,
        newsArticles: newsCount,
        newsExpired: newsExpiredCount,
      }}
      users={adminUsers}
    />
  )
}

import { AdminContent } from './admin-content'
