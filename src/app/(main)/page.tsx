import { prisma } from '@/lib/db'
import { Feed } from '@/components/feed/feed'
import { SearchBar } from '@/components/search/search-bar'
import { SaviezVousCard } from '@/components/feed/saviez-vous-card'

import { getSession, authOptions } from '@/lib/auth'
import Link from 'next/link'
import HomePageClient from './page-client'

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

  const savedIdeaIds: string[] = userId
    ? await prisma.bookmark.findMany({
        where: { userId },
        select: { ideaId: true },
      }).then(bookmarks => bookmarks.map(b => b.ideaId))
    : []

  return (
    <div className="mx-auto max-w-2xl p-4 pb-20 md:p-6 md:pb-6">
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

      <HomePageClient
        initialIdeas={ideas}
        initialHasMore={hasMore}
        initialTotal={total}
        userId={userId}
        savedIdeaIds={savedIdeaIds}
      />
    </div>
  )
}
