import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { SuggestionList } from '@/components/lobby/suggestion-list'

export default async function MySuggestionsPage() {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value as 'fr' | 'en') || 'fr'

  const suggestions = await prisma.userSuggestion.findMany({
    where: { userId: session.user.id! },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { comments: true } },
      user: { select: { id: true, displayName: true, email: true } },
    },
  })

  const suggestionsWithFormattedDates = suggestions.map(s => ({
    ...s,
    formattedCreatedAt: s.createdAt.toLocaleDateString(locale),
  }))

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <h1 className="text-2xl font-bold">Mon lobby</h1>
      <p className="mb-6 text-sm text-muted-foreground">Gérez vos propositions de sujets</p>
      <SuggestionList suggestions={suggestionsWithFormattedDates} currentUserId={session.user.id} />
    </div>
  )
}
