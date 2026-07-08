import { prisma } from '@/lib/db'
import Link from 'next/link'
import type { Metadata } from 'next'

import { getSession } from '@/lib/auth'
import { markIdeaViewedAction } from '@/actions/view-actions'
import { SwipeableIdeaDetail } from '@/components/feed/swipeable-idea-detail'
import { IdeaDetailClient } from './idea-detail-client'

async function getPrevNext(slug: string, currentOrderIndex: number, topic?: string, collection?: string) {
  const where: { isPublished: boolean; orderIndex: { not: number }; ideaTopics?: { some: { topicId: { in: string[] } } } } = {
    isPublished: true,
    orderIndex: { not: currentOrderIndex },
  }

  if (topic) {
    const topicRecord = await prisma.topic.findUnique({
      where: { slug: topic },
      select: { id: true, children: { select: { id: true } } },
    })
    if (topicRecord) {
      where.ideaTopics = {
        some: {
          topicId: {
            in: [topicRecord.id, ...topicRecord.children.map((c) => c.id)],
          },
        },
      }
    }
  }

  if (collection) {
    const collectionRecord = await prisma.collection.findUnique({
      where: { slug: collection },
      select: { topics: { select: { id: true, children: { select: { id: true } } } } },
    })
    if (collectionRecord) {
      const topicIds = collectionRecord.topics.flatMap((t) => [t.id, ...t.children.map((c) => c.id)])
      where.ideaTopics = {
        some: {
          topicId: {
            in: topicIds,
          },
        },
      }
    }
  }

  const [prev, next] = await Promise.all([
    prisma.idea.findFirst({
      where: { ...where, orderIndex: { lt: currentOrderIndex } },
      orderBy: { orderIndex: 'desc' },
      select: { slug: true, title: true },
    }),
    prisma.idea.findFirst({
      where: { ...where, orderIndex: { gt: currentOrderIndex } },
      orderBy: { orderIndex: 'asc' },
      select: { slug: true, title: true },
    }),
  ])

  return { prev, next }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const idea = await prisma.idea.findUnique({
    where: { slug },
    include: {
      source: true,
      ideaTopics: {
        include: {
          topic: { select: { name: true, icon: true } },
        },
      },
    },
  })

  if (!idea) {
    return { title: 'Idée introuvable | MoinsBête' }
  }

  const isValidUrl = (url: string) => {
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moinsbete.guibo.com'
  const pageUrl = new URL(idea.slug, `${baseUrl}/idees/`).href
  const coverUrl = idea.source.coverUrl && isValidUrl(idea.source.coverUrl) ? idea.source.coverUrl : null

  return {
    title: `${idea.title} | MoinsBête`,
    description: idea.takeaway,
    authors: [{ name: 'MoinsBête' }],
    openGraph: {
      title: idea.title,
      description: idea.takeaway,
      type: 'article',
      url: pageUrl,
      siteName: 'MoinsBête',
      locale: 'fr_FR',
      images: coverUrl ? [{ url: coverUrl, width: 1200, height: 630, alt: idea.title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@MoinsBete',
      creator: '@MoinsBete',
      title: idea.title,
      description: idea.takeaway,
      images: coverUrl ? [coverUrl] : [],
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: pageUrl,
    },
  }
}

export default async function IdeaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ topic?: string; collection?: string }>
}) {
  const { slug } = await params
  const { topic, collection } = await searchParams
  const session = await getSession()

  const idea = await prisma.idea.findUnique({
    where: { slug },
    include: {
      source: true,
      ideaTopics: {
        include: {
          topic: { select: { id: true, name: true, slug: true, icon: true, color: true } },
        },
      },
    },
  })

  if (!idea) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Idée introuvable</h1>
          <Link href="/" className="mt-4 text-primary hover:underline">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    )
  }

  const topics = idea.ideaTopics.map(it => it.topic)

  let isBookmarked = false
  if (session?.user?.id) {
    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_ideaId: {
          userId: session.user.id,
          ideaId: idea.id,
        },
      },
    })
    isBookmarked = !!bookmark
  }

  if (session?.user?.id) {
    queueMicrotask(() => markIdeaViewedAction(idea.id, session.user.id).catch((err) => {
      console.error('[IdeaDetail] markIdeaViewed error:', err)
    }))
  }

  const { prev, next } = await getPrevNext(slug, idea.orderIndex, topic, collection)

  const ideaData = {
    id: idea.id,
    title: idea.title,
    content: idea.content,
    takeaway: idea.takeaway,
    slug: idea.slug,
    saviezVous: idea.saviezVous,
    source: {
      title: idea.source.title,
      type: idea.source.type,
      url: idea.source.url,
      coverUrl: idea.source.coverUrl,
    },
    topics,
  }

  return (
    <>
      {/* Mobile swipeable version */}
      <SwipeableIdeaDetail
        idea={ideaData}
        prev={prev}
        next={next}
        topic={topic}
        collection={collection}
        isBookmarked={isBookmarked}
        mobileOnly
      />

      {/* Desktop static version */}
      <IdeaDetailClient
        idea={ideaData}
        prev={prev}
        next={next}
        topic={topic}
        collection={collection}
        initialBookmarked={isBookmarked}
      />
    </>
  )
}
