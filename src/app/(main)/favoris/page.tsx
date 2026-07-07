import { prisma } from '@/lib/db'

import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FavorisClient } from './favoris-client'

const PAGE_SIZE = 20

export default async function FavorisPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
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

  const currentPage = Math.max(1, parseInt((await searchParams).page || '1', 10))
  const skip = (currentPage - 1) * PAGE_SIZE

  const [bookmarks, total] = await Promise.all([
    prisma.bookmark.findMany({
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
      skip,
      take: PAGE_SIZE,
    }),
    prisma.bookmark.count({
      where: { userId: session.user.id },
    }),
  ])

  const ideas = bookmarks.map(b => ({
    id: b.idea.id,
    title: b.idea.title,
    slug: b.idea.slug,
    topics: b.idea.ideaTopics.map(it => it.topic),
    source: b.idea.source,
  }))

  const totalPages = Math.ceil(total / PAGE_SIZE)

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
            {total} id{total !== 1 ? 'ées' : ''} sauvegardé{total !== 1 ? 'es' : ''}
          </p>
        </div>
      </div>

      {total === 0 ? (
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
        <FavorisClient ideas={ideas} userId={session.user.id} currentPage={currentPage} totalPages={totalPages} total={total} />
      )}
    </div>
  )
}
