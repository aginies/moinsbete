import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { ReviewQueue } from '@/components/admin/review-queue'
import Link from 'next/link'
import { approveSuggestionAction, rejectSuggestionAction, mergeSuggestionAction } from '@/actions/topic-actions'
import { Button } from '@/components/ui/button'

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
  const topics = await prisma.topic.findMany({
    include: {
      _count: { select: { ideaTopics: true } },
      children: true,
    },
    orderBy: { name: 'asc' },
  })

  const suggestions = await prisma.topicSuggestion.findMany({
    where: { status: 'PENDING' },
    include: {
      parentTopic: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const now = new Date()
  const [
    ideaCount,
    ideaUnpubCount,
    topicCount,
    sourceCount,
    collectionCount,
    bookmarkCount,
    userCount,
    viewedIdeaCount,
    activeStreakCount,
    pendingSuggestionCount,
    approvedSuggestionCount,
    rejectedSuggestionCount,
    mergedSuggestionCount,
    userSuggestionCount,
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
  ] = await Promise.all([
    prisma.idea.count({ where: { isPublished: true } }),
    prisma.idea.count({ where: { isPublished: false } }),
    prisma.topic.count(),
    prisma.source.count(),
    prisma.collection.count(),
    prisma.bookmark.count(),
    prisma.user.count(),
    prisma.viewedIdea.count(),
    prisma.growthPlan.count({ where: { streakDays: { gt: 0 } } }),
    prisma.topicSuggestion.count({ where: { status: 'PENDING' } }),
    prisma.topicSuggestion.count({ where: { status: 'APPROVED' } }),
    prisma.topicSuggestion.count({ where: { status: 'REJECTED' } }),
    prisma.topicSuggestion.count({ where: { status: 'MERGED' } }),
    prisma.userSuggestion.count(),
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
  ])

  return (
    <AdminContent
      topics={topics}
      suggestions={suggestions}
      onApprove={approveSuggestionAction}
      onReject={rejectSuggestionAction}
      onMerge={mergeSuggestionAction}
      stats={{
        ideas: ideaCount,
        ideasUnpublished: ideaUnpubCount,
        topics: topicCount,
        sources: sourceCount,
        collections: collectionCount,
        bookmarks: bookmarkCount,
        users: userCount,
        viewedIdeas: viewedIdeaCount,
        activeStreaks: activeStreakCount,
        pendingSuggestions: pendingSuggestionCount,
        approvedSuggestions: approvedSuggestionCount,
        rejectedSuggestions: rejectedSuggestionCount,
        mergedSuggestions: mergedSuggestionCount,
        userSuggestions: userSuggestionCount,
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
    />
  )
}

import { AdminContent } from './admin-content'
