import { prisma } from '@/lib/db'

import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FavorisPageClient } from './favoris-page-client'
import { mapIdeaWithSourceAndTopics } from '@/lib/feed-helpers'

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

  const [bookmarks, total, radioFavoritesCount, cnrsFavoritesCount, imageDuJourFavoritesCount, saviezVousFavoritesCount, wikimediaFavoritesCount, wikilovesFavoritesCount, pixabayFavoritesCount, portailLexicalCount, proverbeFavoritesCount, bbcNewsFavoritesCount] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId: session.user.id, type: 'IDEA' },
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
      where: { userId: session.user.id, type: 'IDEA' },
    }),
    prisma.bookmark.count({
      where: { userId: session.user.id, type: 'RADIO_FRANCE' },
    }),
    prisma.bookmark.count({
       where: { userId: session.user.id, type: 'CNRS_NEWS' },
     }),
    prisma.bookmark.count({
      where: { userId: session.user.id, type: 'IMAGE_DU_JOUR' },
    }),
    prisma.bookmark.count({
      where: { userId: session.user.id, type: 'SAVIEZ_VOUS' },
    }),
    prisma.bookmark.count({
      where: { userId: session.user.id, type: 'IMAGE_WIKIMEDIA' },
    }),
    prisma.bookmark.count({
      where: { userId: session.user.id, type: 'IMAGE_WIKILOVES' },
    }),
    prisma.bookmark.count({
      where: { userId: session.user.id, type: 'IMAGE_PIXABAY' },
    }),
    prisma.bookmark.count({
      where: { userId: session.user.id, type: 'PORTAIL_LEXICAL' },
    }),
    prisma.bookmark.count({
      where: { userId: session.user.id, type: 'PROVERBE' },
    }),
    prisma.bookmark.count({
      where: { userId: session.user.id, type: 'BBC_NEWS' },
    }),
  ])

  const ideas = bookmarks.filter(b => b.idea !== null).map(b => mapIdeaWithSourceAndTopics(b.idea!))

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="mx-auto w-full px-0 py-4 pb-0 md:pb-20 md:max-w-4xl md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="mb-2 hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:inline-flex"
          >
            <ArrowLeft className="h-4 w-4" />
            Accueil
          </Link>
          <h1 className="text-2xl font-heading font-bold">Favoris</h1>
        </div>
      </div>

      <FavorisPageClient
        ideas={ideas}
        userId={session.user.id}
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        radioFavoritesCount={radioFavoritesCount}
        cnrsFavoritesCount={cnrsFavoritesCount}
        imageDuJourFavoritesCount={imageDuJourFavoritesCount}
        saviezVousFavoritesCount={saviezVousFavoritesCount}
        wikimediaFavoritesCount={wikimediaFavoritesCount}
        wikilovesFavoritesCount={wikilovesFavoritesCount}
        pixabayFavoritesCount={pixabayFavoritesCount}
        portailLexicalCount={portailLexicalCount}
        proverbeFavoritesCount={proverbeFavoritesCount}
        bbcNewsFavoritesCount={bbcNewsFavoritesCount}
      />
    </div>
  )
}
