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

  const rowCounts = await prisma.$queryRaw<{ type: string, count: bigint }[]>`
    SELECT type, COUNT(*) as count
    FROM Bookmark
    WHERE userId = ${session.user.id}
    GROUP BY type
  `

  const countMap = new Map<string, number>()
  for (const row of rowCounts) {
    countMap.set(row.type, Number(row.count))
  }

  const sourceCounts: Record<string, number> = {
    imageDuJour: countMap.get('IMAGE_DU_JOUR') ?? 0,
    wikimedia: countMap.get('IMAGE_WIKIMEDIA') ?? 0,
    wikiloves: countMap.get('IMAGE_WIKILOVES') ?? 0,
    pixabay: countMap.get('IMAGE_PIXABAY') ?? 0,
    portailLexical: countMap.get('PORTAIL_LEXICAL') ?? 0,
    portailWikipedia: countMap.get('PORTAIL_WIKIPEDIA') ?? 0,
    proverbe: countMap.get('PROVERBE') ?? 0,
    saviezVous: countMap.get('SAVIEZ_VOUS') ?? 0,
    radioFrance: countMap.get('RADIO_FRANCE') ?? 0,
    cnrs: countMap.get('CNRS_NEWS') ?? 0,
    news: countMap.get('NEWS') ?? 0,
    f1: countMap.get('F1') ?? 0,
    citation: countMap.get('CITATION') ?? 0,
    insolite: countMap.get('INSOLITE') ?? 0,
    apod: countMap.get('APOD') ?? 0,
  }

  const total = countMap.get('IDEA') ?? 0

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
        counts={sourceCounts}
      />
    </div>
  )
}
