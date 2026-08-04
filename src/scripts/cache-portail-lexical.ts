import { prisma } from '@/lib/db'

const PORTAIL_LEXICAL_BASE = 'https://www.portail-lexical.fr'

interface WotdResponse {
  form: string
  pos: string
  full_form: string
  full_pos: string
}

export async function scrapeAndCachePortailLexicalWotd() {
  console.log('  🔍 Fetching Portail Lexical Word of the Day...')
  try {
    const res = await fetch(`${PORTAIL_LEXICAL_BASE}/api/wotd`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      console.error(`  ⚠️ Portail Lexical API returned status ${res.status}`)
      return
    }
    const data: WotdResponse = await res.json()
    if (data && data.form) {
      const today = new Date().toISOString().split('T')[0]
      const word = data.form.trim()

      const result = await prisma.portailLexicalMotDuJour.upsert({
        where: { date: today },
        create: { date: today, word },
        update: { word },
      })

      if (result.word === word) {
        console.log(`  ℹ️ Word of the day for ${today} is already up to date: "${word}"`)
      } else {
        console.log(`  ✅ Saved word of the day for ${today}: "${word}"`)
      }
    } else {
      console.error('  ⚠️ Invalid response format from Portail Lexical API:', data)
    }
  } catch (error) {
    console.error('  ⚠️ Error caching Portail Lexical wotd:', error)
  }
}

scrapeAndCachePortailLexicalWotd()
