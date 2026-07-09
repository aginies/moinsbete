import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { Feed } from '@/components/feed/feed'
import Link from 'next/link'
import { ArrowLeft, BookmarkCheck } from 'lucide-react'
import { mapIdeaWithTopics } from '@/lib/feed-helpers'
import type { IdeaSource } from '@/types/idea'

interface CollectionIdea {
  id: string
  title: string
  content: string
  takeaway: string
  slug: string
  saviezVous: string | null
  isPublished: boolean
  ideaTopics: Array<{
    topic: {
      id: string
      name: string
      slug: string
      icon: string
      color: string
    }
  }>
  source: IdeaSource
}

interface CollectionIdeaTopic {
  idea: CollectionIdea
}

interface TopicWithIdeas {
  ideaTopics: CollectionIdeaTopic[]
}

interface CollectionData {
  id: string
  title: string
  description: string | null
  topics: TopicWithIdeas[]
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await getSession()
  const userId = session?.user?.id

  const collection = await prisma.collection.findUnique({
    where: { slug },
    include: {
      topics: {
        include: {
          ideaTopics: {
            include: {
              idea: {
                include: {
                  ideaTopics: {
                    include: {
                      topic: { select: { id: true, name: true, slug: true, icon: true, color: true } },
                    },
                  },
                  source: { select: { title: true, type: true, url: true, coverUrl: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!collection) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Collection introuvable</h1>
          <Link href="/" className="mt-4 text-primary hover:underline">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    )
  }

  const ideasMap = new Map<string, CollectionIdea>()
  for (const topic of collection.topics) {
    for (const it of topic.ideaTopics) {
      if (it.idea && it.idea.isPublished && !ideasMap.has(it.idea.id)) {
        ideasMap.set(it.idea.id, it.idea)
      }
    }
  }

  const viewedIdeaIds = userId
    ? await prisma.viewedIdea.findMany({
        where: { userId },
        select: { ideaId: true },
      }).then(v => new Set(v.map((item) => item.ideaId)))
    : new Set<string>()

  const ideasWithTopics = Array.from(ideasMap.values()).map(idea => ({
    ...idea,
    topics: mapIdeaWithTopics(idea),
  })).filter(idea => !viewedIdeaIds.has(idea.id))

  return (
    <div className="mx-auto w-full px-0 py-4 pb-20 md:max-w-2xl md:p-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        Accueil
      </Link>

      <div className="mb-6 rounded-2xl border border-border/60 bg-card p-6">
        <BookmarkCheck className="mb-3 h-8 w-8 text-primary" />
        <h1 className="mb-2 text-2xl font-heading font-bold">{collection.title}</h1>
        {collection.description && (
          <p className="text-sm text-muted-foreground">{collection.description}</p>
        )}
        <p className="mt-3 text-sm text-muted-foreground">
          {ideasWithTopics.length} idée{ideasWithTopics.length !== 1 ? 's' : ''}
        </p>
      </div>

      <Feed
        initialIdeas={ideasWithTopics}
        initialHasMore={false}
        userId={userId}
        savedIdeaIds={new Set()}
      />
    </div>
  )
}
