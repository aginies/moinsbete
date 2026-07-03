import { prisma } from '@/lib/db'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, BookOpen, ExternalLink } from 'lucide-react'

import { getSession, authOptions } from '@/lib/auth'
import { markIdeaViewed } from '@/actions/view-actions'

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
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

  console.log('[IdeaDetail] session:', session ? { userId: session.user?.id } : 'null')

  if (session?.user?.id) {
    await markIdeaViewed(idea.id, session.user.id).catch((err) => {
      console.error('[IdeaDetail] markIdeaViewed error:', err)
    })
  }

  return (
    <div className="mx-auto max-w-2xl p-4 pb-20 md:p-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Accueil
      </Link>

      <div className="mb-4 flex flex-wrap gap-2">
        {topics.map((topic) => (
          <Link
            key={topic.id}
            href={`/sujets/${topic.slug}`}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium transition-colors hover:opacity-80"
            style={{
              backgroundColor: `${topic.color}15`,
              color: topic.color,
            }}
          >
            <span>{topic.icon}</span>
            <span>{topic.name}</span>
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

      <div className="rounded-xl border border-border/60 bg-card p-4">
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Source</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{idea.source.title}</p>
            {idea.source.url && (
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
  )
}
