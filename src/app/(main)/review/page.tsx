import { getSession } from '@/lib/auth'
import { ReviewPageClient } from './review-page-client'

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
    <div className="mx-auto w-full px-0 py-4 pb-20 md:max-w-4xl md:p-6">
      <h1 className="mb-6 text-2xl font-heading font-bold">Révision</h1>
      <ReviewPageClient userId={session.user.id} currentPage={currentPage} />
    </div>
  )
}
