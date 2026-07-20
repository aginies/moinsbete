import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { ProverbesPageClient } from './proverbes-page-client'

export const dynamic = 'force-dynamic'

export default async function ProverbesPage() {
  const session = await getSession()
  const userId = session?.user?.id

  const proverbeCardVisible = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { proverbeCardVisible: true },
      }).then(u => u?.proverbeCardVisible ?? true)
    : true

  return (
    <ProverbesPageClient
      userId={userId}
      initialVisibility={proverbeCardVisible}
    />
  )
}
