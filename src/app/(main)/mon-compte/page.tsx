import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import MonCompteClient from './client'
import type { Session } from 'next-auth'

interface ExtendedSession extends Session {
  emailNotificationsEnabled?: boolean
}

export default async function MonComptePage() {
  const session = await getSession()

  if (!session?.user) {
    return (
      <div className="mx-auto w-full px-0 py-4 pb-20 md:max-w-2xl md:p-6">
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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailNotificationsEnabled: true },
  })

  const extendedSession = { ...session, emailNotificationsEnabled: user?.emailNotificationsEnabled ?? true } as ExtendedSession

  return <MonCompteClient session={extendedSession} />
}
