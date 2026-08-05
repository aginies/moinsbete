import { prisma } from '@/lib/db'
import { PortailLexicalPageClient } from './portail-lexical-page-client'

export const dynamic = 'force-dynamic'

export default async function PortailLexicalPage() {
  const today = new Date().toISOString().split('T')[0]
  const allWords = await prisma.portailLexicalMotDuJour.findMany({
    where: { date: { lt: today } },
    orderBy: { date: 'desc' },
    select: {
      date: true,
      word: true,
    },
  })

  const seen = new Set<string>()
  const historicalWords = allWords.filter((item) => {
    const lower = item.word.toLowerCase()
    if (seen.has(lower)) return false
    seen.add(lower)
    return true
  })

  return <PortailLexicalPageClient historicalWords={historicalWords} />
}
