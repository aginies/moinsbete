import { prisma } from '@/lib/db'
import { Feed } from '@/components/feed/feed'
import { SearchBar } from '@/components/search/search-bar'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Globe, FileText, Headphones } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const sourceTypeIcons: Record<string, React.ReactNode> = {
  WIKIPEDIA: <Globe className="h-4 w-4" />,
  BOOK: <BookOpen className="h-4 w-4" />,
  ARTICLE: <FileText className="h-4 w-4" />,
  PODCAST: <Headphones className="h-4 w-4" />,
}

const sourceTypeLabels: Record<string, string> = {
  WIKIPEDIA: 'Wikipédia',
  BOOK: 'Livre',
  ARTICLE: 'Article',
  PODCAST: 'Podcast',
}

export default async function SourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const source = await prisma.source.findFirst({
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
        },
        orderBy: { orderIndex: 'asc' },
      },
    },
  })

  if (!source) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Source introuvable</h1>
          <Link href="/" className="mt-4 text-primary hover:underline">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    )
  }

  const ideasWithTopics = source.ideas.map(idea => ({
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
        <div className="mb-3 flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            {sourceTypeIcons[source.type] || <BookOpen className="h-4 w-4" />}
            {sourceTypeLabels[source.type] || source.type}
          </Badge>
        </div>

        <h1 className="mb-2 text-2xl font-heading font-bold">{source.title}</h1>

        {source.author && (
          <p className="text-sm text-muted-foreground">par {source.author}</p>
        )}

        {source.description && (
          <p className="mt-3 text-sm text-muted-foreground">{source.description}</p>
        )}

        {source.url && (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Globe className="h-4 w-4" />
            Voir la source
          </a>
        )}
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">
          {ideasWithTopics.length} idée{ideasWithTopics.length !== 1 ? 's' : ''}
        </h2>
      </div>

      <Feed
        initialIdeas={ideasWithTopics}
        initialHasMore={false}
        savedIdeaIds={new Set()}
      />
    </div>
  )
}
