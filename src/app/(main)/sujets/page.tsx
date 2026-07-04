import { prisma } from '@/lib/db'
import { TopicGrid } from '@/components/topics/topic-grid'
import { SearchBar } from '@/components/search/search-bar'
import { SaviezVousCard } from '@/components/feed/saviez-vous-card'
import { resolveWikimediaImageUrls } from '@/lib/utils'
import Link from 'next/link'

async function getRandomFact() {
  try {
    const total = await prisma.saviezVousFact.count()
    if (total === 0) return null
    
    const randomOffset = Math.floor(Math.random() * total)
    const [fact] = await prisma.saviezVousFact.findMany({
      skip: randomOffset,
      take: 1,
      select: { id: true, text: true, sourceUrl: true, imageFilename: true },
    })
    if (!fact) return null

    const resolved = await resolveWikimediaImageUrls([{ id: fact.id, imageFilename: fact.imageFilename }])
    const resolvedFact = resolved[0]
    if (resolvedFact.imageFilename && !resolvedFact.imageFilename.startsWith('http')) {
      await prisma.saviezVousFact.update({
        where: { id: fact.id },
        data: { imageFilename: resolvedFact.imageFilename },
      })
    }
    return { text: fact.text, sourceUrl: fact.sourceUrl, imageFilename: resolvedFact.imageFilename }
  } catch {
    return null
  }
}

export default async function SujetsPage() {
  const topics = await prisma.topic.findMany({
    include: {
      _count: { select: { ideaTopics: true } },
      children: true,
    },
    orderBy: { name: 'asc' },
  })

  const saviezVousFact = await getRandomFact()

  return (
    <div className="mx-auto max-w-4xl p-4 pb-20 md:p-6">
      {saviezVousFact && (
        <div className="mb-6">
          <SaviezVousCard text={saviezVousFact.text} sourceUrl={saviezVousFact.sourceUrl} imageFilename={saviezVousFact.imageFilename} />
        </div>
      )}

      <div className="mb-6">
        <Link
          href="/idees/au-hasard"
          className="block rounded-xl border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 dark:border-blue-600 dark:from-blue-950/30 dark:to-indigo-950/30 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 dark:bg-blue-600">
              <span className="text-lg">🎲</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-blue-800 dark:text-blue-200">
                Carte aléatoire
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-300">
                Découvrir au Hasard
              </p>
            </div>
          </div>
        </Link>
      </div>

      <SearchBar />

      <TopicGrid topics={topics} />
    </div>
  )
}
