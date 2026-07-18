import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { cleanupExpiredCache } from '@/actions/cleanup-actions'
import { Button } from '@/components/ui/button'

interface AdminUser {
  id: string
  email: string
  displayName: string | null
  role: string
  enabled: boolean
  createdAt: Date
}

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
    cnrsCount,
    cnrsExpiredCount,
    radioCount,
    radioExpiredCount,
    wikiImageCount,
    wikiImageExpiredCount,
    wikiLovesCount,
    wikiLovesExpiredCount,
    saviezVousCount,
    srsDueCount,
    users,
  ] = await Promise.all([
    prisma.idea.count({ where: { isPublished: true } }),
    prisma.topic.count(),
    prisma.source.count(),
    prisma.bookmark.count(),
    prisma.user.count(),
    prisma.viewedIdea.count(),
    prisma.growthPlan.count({ where: { streakDays: { gt: 0 } } }),
    prisma.cachedCnrsArticle.count(),
    prisma.cachedCnrsArticle.count({ where: { expiresAt: { lt: now } } }),
    prisma.cachedRadioEpisode.count(),
    prisma.cachedRadioEpisode.count({ where: { expiresAt: { lt: now } } }),
    prisma.cachedWikipediaImage.count(),
    prisma.cachedWikipediaImage.count({ where: { expiresAt: { lt: now } } }),
    prisma.cachedWikiLovesImage.count(),
    prisma.cachedWikiLovesImage.count({ where: { expiresAt: { lt: now } } }),
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
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        enabled: true,
        createdAt: true,
      },
    }),
  ])

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
      }}
      users={adminUsers}
    />
  )
}

import { AdminContent } from './admin-content'
