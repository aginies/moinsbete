import { getSession } from '@/lib/auth'
import Link from 'next/link'
import MonCompteClient from './client'

export default async function MonComptePage() {
  const session = await getSession()

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-2xl p-4 pb-20 md:p-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-heading font-bold">Mon compte</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connectez-vous pour gérer votre compte
          </p>
          <Link href="/login" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  return <MonCompteClient session={session} />
}
