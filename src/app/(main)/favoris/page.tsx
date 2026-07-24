import { prisma } from '@/lib/db'

import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { Bookmark } from 'lucide-react'
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

  const counts = await prisma.$queryRaw<{ type: string, count: bigint }[]>`
    SELECT type, COUNT(*) as count
    FROM Bookmark
    WHERE userId = ${session.user.id}
    GROUP BY type
  `

  const countMap = new Map<string, number>()
  for (const row of counts) {
    countMap.set(row.type, Number(row.count))
  }

  const total = countMap.get('IDEA') ?? 0
  const radioFavoritesCount = countMap.get('RADIO_FRANCE') ?? 0
  const cnrsFavoritesCount = countMap.get('CNRS_NEWS') ?? 0
  const imageDuJourFavoritesCount = countMap.get('IMAGE_DU_JOUR') ?? 0
  const saviezVousFavoritesCount = countMap.get('SAVIEZ_VOUS') ?? 0
  const wikimediaFavoritesCount = countMap.get('IMAGE_WIKIMEDIA') ?? 0
  const wikilovesFavoritesCount = countMap.get('IMAGE_WIKILOVES') ?? 0
  const pixabayFavoritesCount = countMap.get('IMAGE_PIXABAY') ?? 0
  const portailLexicalCount = countMap.get('PORTAIL_LEXICAL') ?? 0
  const proverbeFavoritesCount = countMap.get('PROVERBE') ?? 0
  const newsFavoritesCount = countMap.get('NEWS') ?? 0

  const [bookmarks] = await Promise.all([
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
  ])

  const ideas = bookmarks.filter(b => b.idea !== null).map(b => mapIdeaWithSourceAndTopics(b.idea!))

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="mx-auto w-full px-0 py-4 pb-20 md:max-w-4xl md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold">Favoris</h1>
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
        newsFavoritesCount={newsFavoritesCount}
      />
    </div>
  )
}
