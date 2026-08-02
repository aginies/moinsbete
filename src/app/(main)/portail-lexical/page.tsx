import { prisma } from '@/lib/db'
import { PortailLexicalPageClient } from './portail-lexical-page-client'

export const dynamic = 'force-dynamic'

export default async function PortailLexicalPage() {
  const historicalWords = await prisma.portailLexicalMotDuJour.findMany({
    orderBy: { date: 'desc' },
    select: {
      date: true,
      word: true,
    },
  })

  return <PortailLexicalPageClient historicalWords={historicalWords} />
}
