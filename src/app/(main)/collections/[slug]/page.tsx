import { prisma } from '@/lib/db'
import { Feed } from '@/components/feed/feed'
import Link from 'next/link'
import { ArrowLeft, BookmarkCheck } from 'lucide-react'

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const collection = await prisma.collection.findUnique({
    where: { slug },
    include: {
      ideas: {
        where: { isPublished: true },
        include: {
          ideaTopics: {
            include: {
              topic: { select: { name: true, slug: true, icon: true, color: true } },
            },
          },
          source: { select: { title: true, url: true } },
        },
        orderBy: { orderIndex: 'asc' },
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

  const ideasWithTopics = collection.ideas.map(idea => ({
    ...idea,
    topics: idea.ideaTopics.map(it => it.topic),
  }))

  return (
    <div className="mx-auto max-w-2xl p-4 pb-20 md:p-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
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
        savedIdeaIds={new Set()}
      />
    </div>
  )
}
