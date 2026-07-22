import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { SuggestionDetail } from '@/components/lobby/suggestion-detail'

export default async function SuggestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value as 'fr' | 'en') || 'fr'

  const suggestion = await prisma.userSuggestion.findUnique({
    where: { id: (await params).id },
    include: {
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, displayName: true, email: true } },
        },
      },
      user: { select: { id: true, displayName: true, email: true } },
    },
  })

  if (!suggestion) redirect('/lobby')

  const suggestionWithFormattedDates = {
    ...suggestion,
    formattedCreatedAt: suggestion.createdAt.toLocaleDateString(locale),
    formattedUpdatedAt: suggestion.updatedAt.toLocaleDateString(locale),
    comments: suggestion.comments.map((c: { id: string; content: string; createdAt: Date; updatedAt: Date; user: { id: string; displayName: string | null; email: string } }) => ({
      ...c,
      formattedCreatedAt: c.createdAt.toLocaleDateString(locale),
    })),
  }

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <Link href="/lobby" className="mb-4 inline-block text-sm text-primary hover:underline">
        ← Retour au Lobby
      </Link>
      <SuggestionDetail
        suggestion={suggestionWithFormattedDates}
        currentUserId={session.user.id}
        isAdmin={session.user.role === 'ADMIN'}
      />
    </div>
  )
}
