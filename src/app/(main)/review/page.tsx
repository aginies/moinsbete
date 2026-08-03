import { getSession } from '@/lib/auth'
import { FlashcardPageClient } from './flashcard-page-client'
import { LexicalPageClient } from './lexical-page-client'
import ReviewPageClient from './review-page-client'

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const session = await getSession()

  if (!session?.user) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">Révision</h1>
          <p className="mb-4 text-sm text-muted-foreground">
            Connectez-vous pour réviser vos idées
          </p>
        </div>
      </div>
    )
  }

  const currentPage = Math.max(1, parseInt((await searchParams).page || '1', 10))

  return (
    <ReviewPageClient currentPage={currentPage} />
  )
}
