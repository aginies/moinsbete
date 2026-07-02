import { prisma } from '@/lib/db'
import { Feed } from '@/components/feed/feed'
import { SearchBar } from '@/components/search/search-bar'
import { SaviezVousCard } from '@/components/feed/saviez-vous-card'

import { getSession, authOptions } from '@/lib/auth'
import Link from 'next/link'

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

export default async function HomePage() {
  const session = await getSession()
  const userId = session?.user?.id

  const params = new URLSearchParams({ page: '1', limit: '10' })
  if (userId) params.set('userId', userId)

  const ideasRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/feed?${params}`, {
    next: { revalidate: 60 },
  })
  const { ideas, hasMore, total } = await ideasRes.json()

  const saviezVousFact = await getRandomFact()

  const savedIdeaIds = new Set<string>()

  return (
    <div className="mx-auto max-w-2xl p-4 pb-20 md:p-6 md:pb-6">
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-heading font-bold">
          Remplacez le scroll infini par l&apos;apprentissage rapide
        </h1>
        <p className="text-sm text-muted-foreground">
          {total} idées à découvrir
        </p>
      </div>

      {!userId && (
        <div className="mb-6 rounded-lg border border-border/60 bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Créez un compte pour suivre votre progression et ne voir que les idées non lues
          </p>
          <Link href="/register" className="mt-2 text-sm font-medium text-primary hover:underline">
            Créer un compte
          </Link>
        </div>
      )}

      {saviezVousFact && (
        <div className="mb-6">
          <SaviezVousCard text={saviezVousFact} />
        </div>
      )}

      <SearchBar />

      <Feed
        initialIdeas={ideas}
        initialHasMore={hasMore}
        initialTotal={total}
        savedIdeaIds={savedIdeaIds}
        userId={userId}
      />
    </div>
  )
}
