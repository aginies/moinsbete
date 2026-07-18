import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SuggestionForm } from '@/components/lobby/suggestion-form'

export default async function NewPropositionPage() {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <h1 className="text-2xl font-bold">Proposer un sujet</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Suggérez un nouveau sujet d&apos;apprentissage. Il sera visible par tous les utilisateurs.
      </p>
      <SuggestionForm mode="create" />
    </div>
  )
}
