import { getSession } from '@/lib/auth'
import { GraphPageClient } from './graph-page-client'

export default async function CarteMentalePage() {
  const session = await getSession()

  if (!session?.user) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">Carte Mentale</h1>
          <p className="mb-4 text-sm text-muted-foreground">
            Connectez-vous pour voir votre carte mentale
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full px-0 py-4 md:max-w-6xl md:p-6">
      <h1 className="mb-6 text-2xl font-heading font-bold">Carte Mentale</h1>
      <GraphPageClient userId={session.user.id} />
    </div>
  )
}
