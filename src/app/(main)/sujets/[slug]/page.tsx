import { prisma } from '@/lib/db'
import { Feed } from '@/components/feed/feed'
import { TopicCard } from '@/components/topics/topic-card'
import { SearchBar } from '@/components/search/search-bar'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function SujetDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const topic = await prisma.topic.findUnique({
    where: { slug },
    include: {
      _count: { select: { ideaTopics: true } },
      children: true,
    },
  })

  if (!topic) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sujet introuvable</h1>
          <Link href="/sujets" className="mt-4 text-primary hover:underline">
            ← Retour aux sujets
          </Link>
        </div>
      </div>
    )
  }

  const ideasRes = await fetch(
    `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/feed?topic=${slug}&page=1&limit=10`,
    { next: { revalidate: 60 } }
  )
  const { ideas, hasMore } = await ideasRes.json()

  return (
    <div className="mx-auto max-w-2xl p-4 pb-20 md:p-6">
      <Link
        href="/sujets"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Tous les sujets
      </Link>

      <TopicCard topic={{ ...topic, children: topic.children || [] }} />

      {topic.children && topic.children.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold">Sujets associés</h2>
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
          Idées sur {topic.name}
        </h2>
        <Feed
          topic={slug}
          initialIdeas={ideas}
          initialHasMore={hasMore}
          savedIdeaIds={new Set()}
        />
      </div>
    </div>
  )
}
