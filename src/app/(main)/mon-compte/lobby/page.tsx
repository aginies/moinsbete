import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { SuggestionList } from '@/components/lobby/suggestion-list'

export default async function MySuggestionsPage() {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const suggestions = await prisma.userSuggestion.findMany({
    where: { userId: session.user.id! },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { comments: true } },
      user: { select: { id: true, displayName: true, email: true } },
    },
  })

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <h1 className="text-2xl font-bold">Mon lobby</h1>
      <p className="mb-6 text-sm text-muted-foreground">Gérez vos propositions de sujets</p>
      <SuggestionList suggestions={suggestions} currentUserId={session.user.id} />
    </div>
  )
}
