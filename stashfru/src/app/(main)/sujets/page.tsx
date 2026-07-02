import { prisma } from '@/lib/db'
import { TopicGrid } from '@/components/topics/topic-grid'
import { SearchBar } from '@/components/search/search-bar'
import { SaviezVousCard } from '@/components/feed/saviez-vous-card'

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
        const idx = filenames.find(f => f.filename === page.title)?.index
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

      <SearchBar />

      <TopicGrid topics={topics} />
    </div>
  )
}
