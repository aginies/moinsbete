import { prisma } from '@/lib/db'
import { Feed } from '@/components/feed/feed'
import { SaviezVousCard } from '@/components/feed/saviez-vous-card'

import { getSession } from '@/lib/auth'
import { getRandomFact } from '@/lib/saviez-vous'
import Link from 'next/link'
import HomePageClient from './page-client'
import dynamic from 'next/dynamic'

const SearchBar = dynamic(() => import('@/components/search/search-bar').then(m => ({ default: m.SearchBar })), {
  ssr: true,
  loading: () => <div className="h-10 w-full rounded-md border border-border/60 bg-card" />
})

export default async function HomePage() {
  const [session, ideasRes, saviezVousFact] = await Promise.all([
    getSession(),
    fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/feed?page=1&limit=10`, {
      next: { revalidate: 60 },
    }),
    getRandomFact(),
  ])

  const userId = session?.user?.id
  const params = new URLSearchParams({ page: '1', limit: '10' })
  if (userId) params.set('userId', userId)

  const { ideas, hasMore, total } = await ideasRes.json()

  const savedIdeaList = userId
    ? await prisma.bookmark.findMany({
        where: { userId },
        select: { ideaId: true },
      }).then(bookmarks => bookmarks.map(b => b.ideaId))
    : []

  const followedTopics = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { following: { select: { id: true } } },
      })
    : null

  const hasFollowedTopics = followedTopics && followedTopics.following && followedTopics.following.length > 0

  return (
    <div className="mx-auto w-full px-0 py-4 pb-20 md:max-w-2xl md:p-6 md:pb-6">
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
          <SaviezVousCard id={saviezVousFact.id} text={saviezVousFact.text} sourceUrl={saviezVousFact.sourceUrl} imageFilename={saviezVousFact.imageFilename} />
        </div>
      )}

      <div className="mb-6">
        <Link
          href={hasFollowedTopics ? '/idees/au-hasard?followed=1' : '/mon-plan'}
          className="block rounded-xl border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 dark:border-blue-600 dark:from-blue-950/30 dark:to-indigo-950/30 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 dark:bg-blue-600">
              <span className="text-lg">🎲</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-blue-800 dark:text-blue-200">
                {hasFollowedTopics ? 'Carte aléatoire' : 'Choisissez vos sujets'}
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-300">
                {hasFollowedTopics ? 'Découvrir au Hasard' : 'Sélectionnez des sujets dans Mon Plan'}
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
        savedIdeaIds={savedIdeaList}
      />
    </div>
  )
}
