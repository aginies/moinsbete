import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { SuggestionDetail } from '@/components/lobby/suggestion-detail'

export default async function SuggestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user) redirect('/login')

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

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <a href="/lobby" className="mb-4 inline-block text-sm text-primary hover:underline">
        ← Retour aux suggestions
      </a>
      <SuggestionDetail
        suggestion={suggestion}
        currentUserId={session.user.id}
        isAdmin={session.user.role === 'ADMIN'}
      />
    </div>
  )
}
