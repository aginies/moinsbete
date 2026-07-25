import { prisma } from '@/lib/db'
import { Feed } from '@/components/feed/feed'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import type { Metadata } from 'next'
import { getAllDescendantTopicIds, mapIdeaWithTopics } from '@/lib/feed-helpers'

interface FeedWhereClause {
  isPublished: boolean
  viewedIdeas?: { none: { userId: string } }
  ideaTopics?: {
    some: {
      topicId: {
        in: string[]
      }
    }
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const topic = await prisma.topic.findUnique({ where: { slug } })

  if (!topic) {
    return { title: 'Sujet introuvable | MoinsBête' }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moinsbete.guibo.com'
  const pageUrl = `${baseUrl}/sujets/${slug}`
  const description = topic.description || `Explorez des idées sur ${topic.name} et élargissez vos connaissances.`

  return {
    title: `${topic.name} | MoinsBête`,
    description,
    openGraph: {
      title: `${topic.name} - MoinsBête`,
      description,
      type: 'website',
      url: pageUrl,
      siteName: 'MoinsBête',
      locale: 'fr_FR',
    },
    twitter: {
      card: 'summary',
      title: `${topic.name} - MoinsBête`,
      description,
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: pageUrl,
    },
  }
}

export default async function SujetDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await getSession()
  const userId = session?.user?.id
  const t = await getTranslations('feed')

  const topic = await prisma.topic.findUnique({
    where: { slug },
    include: {
      children: true,
    },
  })

  if (!topic) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t('sujet_introuvable')}</h1>
          <Link href="/sujets" className="mt-4 text-primary hover:underline">
            {t('retour_sujets')}
          </Link>
        </div>
      </div>
    )
  }

  const topicIds = await getAllDescendantTopicIds(slug)

  const where: FeedWhereClause = { isPublished: true }
  if (topicIds.length > 0) {
    where.ideaTopics = {
      some: {
        topicId: { in: topicIds },
      },
    }
  }
  if (userId) {
    where.viewedIdeas = { none: { userId } }
  }

  const ideasRaw = await prisma.idea.findMany({
    where,
    select: {
      id: true,
      title: true,
      slug: true,
      source: { select: { title: true, type: true, url: true, coverUrl: true } },
      ideaTopics: {
        include: {
          topic: { select: { id: true, name: true, slug: true, icon: true, color: true } },
        },
      },
    },
    orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
    skip: 0,
    take: 11,
  })

  const hasMore = ideasRaw.length > 10
  const ideas = ideasRaw.slice(0, 10).map(({ ideaTopics, ...idea }) => ({
    ...idea,
    topics: mapIdeaWithTopics({ ideaTopics } as any),
  })) as any

  return (
    <div className="mx-auto w-full px-0 py-4 pb-20 md:max-w-2xl md:p-6">
      <Link
        href="/sujets"
        className="mb-4 hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:inline-flex"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('tous_sujets')}
      </Link>

      <div className="mb-6 flex items-center gap-3 rounded-xl border border-border/60 bg-card p-5">
        <span className="text-3xl">{topic.icon}</span>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">{topic.name}</h1>
        </div>
      </div>

      {topic.children && topic.children.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold">{t('sujets_associés')}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {topic.children.map((child) => (
              <Link
                key={child.id}
                href={`/sujets/${child.slug}`}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-card p-3 text-sm transition-colors hover:border-border"
              >
                <span>{child.icon}</span>
                <span className="font-medium">{child.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">
          {t('idées_sur', { topic: topic.name })}
        </h2>
        <Feed
          topic={slug}
          initialIdeas={ideas}
          initialHasMore={hasMore}
          userId={userId}
          savedIdeaIds={new Set()}
          compact
        />
      </div>
    </div>
  )
}
