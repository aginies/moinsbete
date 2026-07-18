import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { SuggestionForm } from '@/components/lobby/suggestion-form'

export default async function EditSuggestionPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const suggestion = await prisma.userSuggestion.findUnique({
    where: { id: (await params).id },
  })

  if (!suggestion) redirect('/lobby')
  if (suggestion.userId !== session.user.id && session.user.role !== 'ADMIN') redirect('/lobby')

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <a href={`/lobby/${suggestion.id}`} className="mb-4 inline-block text-sm text-primary hover:underline">
        ← Retour
      </a>
      <h1 className="text-2xl font-bold">Modifier la suggestion</h1>
      <p className="mb-6 text-sm text-muted-foreground">Modifiez le titre et la description de votre suggestion</p>
      <SuggestionForm mode="edit" suggestionId={suggestion.id} initialTitle={suggestion.title} initialDescription={suggestion.description} />
    </div>
  )
}
