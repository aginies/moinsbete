import { Feed } from '@/components/feed/feed'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import HistoryPageClient from './history-client'

export default async function HistoryPage() {
  const session = await getSession()

  if (!session?.user?.id) {
    return (
      <div className="mx-auto max-w-2xl p-4 pb-20 md:p-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-heading font-bold">Mon historique</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connectez-vous pour voir votre historique
          </p>
          <Link href="/login" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  const userId = session.user.id

  const historyRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/history?userId=${userId}&page=1&limit=10`, {
    next: { revalidate: 60 },
  })
  const { ideas, hasMore, total } = await historyRes.json()

  return <HistoryPageClient initialIdeas={ideas} initialHasMore={hasMore} initialTotal={total} userId={userId} />
}
