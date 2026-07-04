import { prisma } from '@/lib/db'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, BookOpen, ExternalLink } from 'lucide-react'

import { getSession, authOptions } from '@/lib/auth'
import { markIdeaViewedAction } from '@/actions/view-actions'
import { SwipeableIdeaDetail } from '@/components/feed/swipeable-idea-detail'
import { isValidUrl } from '@/lib/utils'

interface TopicChild {
  id: string
}

interface TopicRecord {
  id: string
  children: TopicChild[]
}

interface CollectionTopic {
  id: string
  children: TopicChild[]
}

interface CollectionRecord {
  id: string
  topics: CollectionTopic[]
}

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

  if (session?.user?.id) {
    await markIdeaViewedAction(idea.id, session.user.id).catch((err) => {
      console.error('[IdeaDetail] markIdeaViewed error:', err)
    })
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
        isBookmarked={false}
      />

      {/* Desktop static version */}
      <div className="hidden md:block">
        <div className="mx-auto max-w-2xl p-4 md:p-6">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Accueil
          </Link>

          <div className="mb-4 flex flex-wrap gap-2">
            {topics.map((topicItem) => (
              <Link
                key={topicItem.id}
                href={`/sujets/${topicItem.slug}`}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium transition-colors hover:opacity-80"
                style={{
                  backgroundColor: `${topicItem.color}15`,
                  color: topicItem.color,
                }}
              >
                <span>{topicItem.icon}</span>
                <span>{topicItem.name}</span>
              </Link>
            ))}
          </div>

          {idea.source.coverUrl && (
            <div className="mb-4 overflow-hidden rounded-xl">
              <Image
                src={idea.source.coverUrl}
                alt={idea.title}
                width={800}
                height={400}
                className="h-64 w-full object-cover"
              />
            </div>
          )}

          <h1 className="mb-4 text-2xl font-heading font-bold leading-tight">
            {idea.title}
          </h1>

          <div className="prose prose-sm dark:prose-invert mb-6 max-w-none">
            <p className="text-base leading-relaxed text-foreground">{idea.content}</p>
          </div>

          <div className="mb-6 rounded-xl border border-border/60 bg-card p-5">
            <h3 className="mb-2 font-semibold text-primary">À retenir</h3>
            <p className="text-sm leading-relaxed text-foreground">{idea.takeaway}</p>
          </div>

          {idea.saviezVous && (
            <div className="mb-6 rounded-xl border border-amber-200/20 bg-amber-500/5 p-4 dark:border-amber-400/10">
              <h3 className="mb-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
                💡 Le saviez-vous ?
              </h3>
              <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-300">
                {idea.saviezVous}
              </p>
            </div>
          )}

          <div className="rounded-xl border border-border/60 bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Source</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{idea.source.title}</p>
                {idea.source.url && isValidUrl(idea.source.url) && (
                  <a
                    href={idea.source.url.startsWith('http') ? idea.source.url : `https://${idea.source.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Voir la source complète
                  </a>
                )}
              </div>
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
