import { prisma } from '@/lib/db'

import { getSession, authOptions } from '@/lib/auth'
import { Feed } from '@/components/feed/feed'
import Link from 'next/link'
import { ArrowLeft, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function FavorisPage() {
  const session = await getSession()

  if (!session?.user) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="text-center">
          <Bookmark className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-bold">Favoris</h1>
          <p className="mb-4 text-sm text-muted-foreground">
            Connectez-vous pour sauvegarder vos idées préférées
          </p>
          <Link href="/login">
            <Button>Se connecter</Button>
          </Link>
        </div>
      </div>
    )
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    include: {
      idea: {
        include: {
          ideaTopics: {
            include: {
              topic: { select: { id: true, name: true, slug: true, icon: true, color: true } },
            },
          },
          source: { select: { title: true, type: true, url: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const ideas = bookmarks.map(b => ({
    ...b.idea,
    topics: b.idea.ideaTopics.map(it => it.topic),
  }))
  const savedIdeaIds = new Set(ideas.map(i => i.id))

  return (
    <div className="mx-auto max-w-2xl p-4 pb-20 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Accueil
          </Link>
          <h1 className="text-2xl font-heading font-bold">Favoris</h1>
          <p className="text-sm text-muted-foreground">
            {ideas.length} id{ideas.length !== 1 ? 'ée' : 'ée'} sauvegardé{ideas.length !== 1 ? 'e' : ''}
          </p>
        </div>
      </div>

      {ideas.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card p-12 text-center">
          <Bookmark className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">Vos favoris sont vides</h3>
          <p className="text-sm text-muted-foreground">
            Cliquez sur le bookmark d&apos;une idée pour la sauvegarder ici.
          </p>
          <Link href="/" className="mt-4 inline-block text-primary hover:underline">
            Découvrir des idées →
          </Link>
        </div>
      ) : (
        <Feed
          initialIdeas={ideas}
          initialHasMore={false}
          savedIdeaIds={savedIdeaIds}
        />
      )}
    </div>
  )
}
