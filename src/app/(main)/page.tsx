import { prisma } from '@/lib/db'
import { Feed } from '@/components/feed/feed'
import { SearchBar } from '@/components/search/search-bar'

export default async function HomePage() {
  const ideasRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/feed?page=1&limit=10`, {
    next: { revalidate: 60 },
  })
  const { ideas, hasMore, total } = await ideasRes.json()

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

      <SearchBar />

      <Feed
        initialIdeas={ideas}
        initialHasMore={hasMore}
        initialTotal={total}
        savedIdeaIds={savedIdeaIds}
      />
    </div>
  )
}
