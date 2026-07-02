import { prisma } from '@/lib/db'
import { TopicGrid } from '@/components/topics/topic-grid'
import { SearchBar } from '@/components/search/search-bar'
import { SaviezVousCard } from '@/components/feed/saviez-vous-card'
import Link from 'next/link'

async function resolveImageUrls(facts: Array<{ id: string; text: string; sourceUrl: string | null; imageFilename: string | null }>) {
  const filenames = facts
    .map((f, i) => ({ filename: f.imageFilename, index: i }))
    .filter(f => f.filename && !f.filename.startsWith('http'))

  if (filenames.length === 0) return facts

  const titles = filenames.map(f => `File:${f.filename}`).join('|')
  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url&format=json&origin=*`,
      { headers: { 'User-Agent': 'MoinsBête/1.0' } }
    )
    const data = await res.json()
    const pages = data?.query?.pages || {}

    for (const pageId of Object.keys(pages)) {
      const page = pages[pageId]
      const url = page?.imageinfo?.[0]?.url
      if (url) {
        const idx = filenames.find(f => f.filename === page.title.replace(/^File:/, ''))?.index
        if (idx !== undefined) {
          facts[idx].imageFilename = url
          await prisma.saviezVousFact.update({
            where: { id: facts[idx].id },
            data: { imageFilename: url },
          })
        }
      }
    }
  } catch {
    // If API fails, keep original filenames
  }

  return facts
}

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

    const resolved = await resolveImageUrls([fact])
    const resolvedFact = resolved[0]
    return { text: resolvedFact.text, sourceUrl: resolvedFact.sourceUrl, imageFilename: resolvedFact.imageFilename }
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
                Découvrez une idée au hasard
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
