import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { SuggestionList } from '@/components/suggestions/suggestion-list'

export default async function SuggestionsPage() {
  const session = await getSession()
  const suggestions = await prisma.userSuggestion.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { comments: true } },
      user: { select: { id: true, displayName: true, email: true } },
    },
  })

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Suggestions</h1>
          <p className="text-sm text-muted-foreground">Proposez des sujets et commentez ceux des autres</p>
        </div>
        {session?.user && (
          <a href="/suggestions/new">
            <span className="text-sm text-primary hover:underline">Proposer un sujet</span>
          </a>
        )}
      </div>
      <SuggestionList suggestions={suggestions} currentUserId={session?.user?.id ?? null} isAdmin={session?.user?.role === 'ADMIN'} />
    </div>
  )
}
