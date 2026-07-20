import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { ProverbesPageClient } from './proverbes-page-client'

export const dynamic = 'force-dynamic'

export default async function ProverbesPage() {
  const session = await getSession()
  const userId = session?.user?.id

  return <ProverbesPageClient userId={userId} />
}
