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
    latestCnrs,
    latestRadio,
    latestNews,
    latestWiki,
    latestWikiLoves,
    latestSaviezVous,
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
        (SELECT COUNT(*) FROM CachedCnrsArticle WHERE datetime(expiresAt) < datetime('now')) as cnrsExpired,
        (SELECT COUNT(*) FROM CachedRadioEpisode) as radioTotal,
        (SELECT COUNT(*) FROM CachedRadioEpisode WHERE datetime(expiresAt) < datetime('now')) as radioExpired,
        (SELECT COUNT(*) FROM CachedWikipediaImage) as wikiImageTotal,
        (SELECT COUNT(*) FROM CachedWikipediaImage WHERE datetime(expiresAt) < datetime('now')) as wikiImageExpired,
        (SELECT COUNT(*) FROM CachedWikiLovesImage) as wikiLovesTotal,
        (SELECT COUNT(*) FROM CachedWikiLovesImage WHERE datetime(expiresAt) < datetime('now')) as wikiLovesExpired,
        (SELECT COUNT(*) FROM CachedNewsArticle) as newsTotal,
        (SELECT COUNT(*) FROM CachedNewsArticle WHERE datetime(expiresAt) < datetime('now')) as newsExpired
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
    prisma.cachedCnrsArticle.findFirst({ orderBy: { scrapedAt: 'desc' }, select: { scrapedAt: true } }),
    prisma.cachedRadioEpisode.findFirst({ orderBy: { scrapedAt: 'desc' }, select: { scrapedAt: true } }),
    prisma.cachedNewsArticle.findFirst({ orderBy: { scrapedAt: 'desc' }, select: { scrapedAt: true } }),
    prisma.cachedWikipediaImage.findFirst({ orderBy: { scrapedAt: 'desc' }, select: { scrapedAt: true } }),
    prisma.cachedWikiLovesImage.findFirst({ orderBy: { scrapedAt: 'desc' }, select: { scrapedAt: true } }),
    prisma.saviezVousFact.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
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

  const formatScrapedAt = (date: Date | null) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

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
        cnrsScrapedAt: formatScrapedAt(latestCnrs?.scrapedAt ?? null),
        radioEpisodes: radioCount,
        radioExpired: radioExpiredCount,
        radioScrapedAt: formatScrapedAt(latestRadio?.scrapedAt ?? null),
        wikiImages: wikiImageCount,
        wikiImageExpired: wikiImageExpiredCount,
        wikiScrapedAt: formatScrapedAt(latestWiki?.scrapedAt ?? null),
        wikiLovesImages: wikiLovesCount,
        wikiLovesExpired: wikiLovesExpiredCount,
        wikiLovesScrapedAt: formatScrapedAt(latestWikiLoves?.scrapedAt ?? null),
        saviezVousFacts: saviezVousCount,
        saviezVousScrapedAt: formatScrapedAt(latestSaviezVous?.createdAt ?? null),
        srsDue: srsDueCount,
        proverbesCached: proverbeRow ? (() => { try { return JSON.parse(proverbeRow.value).length } catch { return 0 } })() : 0,
        newsArticles: newsCount,
        newsExpired: newsExpiredCount,
        newsScrapedAt: formatScrapedAt(latestNews?.scrapedAt ?? null),
      }}
      users={adminUsers}
    />
  )
}

import { AdminContent } from './admin-content'
