import { prisma } from '@/lib/db'
import { TopicGrid } from '@/components/topics/topic-grid'
import { SearchBar } from '@/components/search/search-bar'
import { SaviezVousCard } from '@/components/feed/saviez-vous-card'

async function getRandomFact() {
  try {
    const total = await prisma.saviezVousFact.count()
    if (total === 0) return null
    
    const randomOffset = Math.floor(Math.random() * total)
    const [fact] = await prisma.saviezVousFact.findMany({
      skip: randomOffset,
      take: 1,
    })
    return fact?.text || null
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
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold">Explorer les sujets</h1>
        <p className="text-sm text-muted-foreground">
          {topics.length} sujets à découvrir
        </p>
      </div>

      {saviezVousFact && (
        <div className="mb-6">
          <SaviezVousCard text={saviezVousFact} />
        </div>
      )}

      <SearchBar />

      <TopicGrid topics={topics} />
    </div>
  )
}
