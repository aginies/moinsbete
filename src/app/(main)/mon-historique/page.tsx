import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import HistoryPageClient from './history-client'

export default async function HistoryPage() {
  const session = await getSession()
  const cookieStore = await cookies()

  if (!session?.user?.id) {
    return (
      <div className="mx-auto w-full px-0 py-4 pb-20 md:max-w-2xl md:p-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-heading font-bold">Mon historique</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connectez-vous pour voir votre historique
          </p>
          <Link href="/login" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  const userId = session.user.id

  const sessionCookie = cookieStore.get('__Secure-next-auth.session-token') || cookieStore.get('next-auth.session-token')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (sessionCookie) {
    headers['cookie'] = `${sessionCookie.name}=${sessionCookie.value}`
  }

  const historyRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/history?page=1&limit=50`, {
    headers,
  })
  const { ideas, total } = await historyRes.json()

  const totalIdeas = await prisma.idea.count({ where: { isPublished: true } })

  return <HistoryPageClient initialIdeas={ideas} total={total} totalIdeas={totalIdeas} userId={userId} />
}
