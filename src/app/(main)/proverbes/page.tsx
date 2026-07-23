import { getSession } from '@/lib/auth'
import { ProverbesPageClient } from './proverbes-page-client'

export const dynamic = 'force-dynamic'

export default async function ProverbesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await getSession()
  const userId = session?.user?.id
  const { q } = await searchParams

  return <ProverbesPageClient userId={userId} initialQuery={q} />
}
