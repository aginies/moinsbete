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
      
      const existing = await prisma.portailLexicalMotDuJour.findUnique({
        where: { date: today }
      })

      if (existing) {
        if (existing.word !== word) {
          await prisma.portailLexicalMotDuJour.update({
            where: { date: today },
            data: { word }
          })
          console.log(`  ✅ Updated word of the day for ${today}: "${word}" (was "${existing.word}")`)
        } else {
          console.log(`  ℹ️ Word of the day for ${today} is already up to date: "${word}"`)
        }
      } else {
        await prisma.portailLexicalMotDuJour.create({
          data: { date: today, word }
        })
        console.log(`  ✅ Saved new word of the day for ${today}: "${word}"`)
      }
    } else {
      console.error('  ⚠️ Invalid response format from Portail Lexical API:', data)
    }
  } catch (error) {
    console.error('  ⚠️ Error caching Portail Lexical wotd:', error)
  }
}

scrapeAndCachePortailLexicalWotd()
