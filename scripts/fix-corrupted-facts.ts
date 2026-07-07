import 'dotenv/config'
import { PrismaClient } from '../src/generated/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing corrupted facts with missing {{unité|...}} content\n')

  // Get unique corrupted facts (remove duplicates)
  const corruptedFacts = await prisma.saviezVousFact.findMany({
    where: {
      text: {
        contains: 'environ sur'
      }
    },
    select: { id: true, text: true, sourceUrl: true },
  })

  // Remove duplicates by text
  const uniqueFacts = new Map<string, typeof corruptedFacts[0]>()
  for (const fact of corruptedFacts) {
    if (!uniqueFacts.has(fact.text)) {
      uniqueFacts.set(fact.text, fact)
    }
  }

  console.log(`Found ${uniqueFacts.size} unique corrupted facts\n`)

  for (const [text, fact] of uniqueFacts) {
    console.log(`\n--- Original: ${text}`)
    console.log(`   ID: ${fact.id}`)
    console.log(`   Source: ${fact.sourceUrl}`)

    if (fact.sourceUrl && fact.sourceUrl.includes('wikipedia.org')) {
      const urlMatch = fact.sourceUrl.match(/wikipedia\.org\/wiki\/(.+)/)
      if (urlMatch) {
        const pageTitle = decodeURIComponent(urlMatch[1])
        const encodedTitle = encodeURIComponent(pageTitle)
        const apiUrl = `https://fr.wikipedia.org/w/api.php?action=query&titles=${encodedTitle}&prop=revisions&rvprop=content&format=json`

        try {
          const res = await fetch(apiUrl)
          const data = await res.json()
          const pages = data.query.pages
          const page = Object.values(pages)[0] as any

          if (page && page.revisions && page.revisions[0]) {
            const content = page.revisions[0]['*']

            // Apply fixed cleanText
            let clean = content
            clean = clean.replace(/\[\[Fichier:[^\]]*\]\]/g, '')
            clean = clean.replace(/\[\[Image:[^\]]*\]\]/g, '')
            clean = clean.replace(/\[\[([^\]|]+)(\|[^\]]*)?\]\]/g, '$1')
            clean = clean.replace(/'''([^']*)'''/g, '$1')
            clean = clean.replace(/''([^']*)''/g, '$1')
            clean = clean.replace(/\{\{unité\|([^|]*)\|([^}]*)\}\}/g, '$1 $2')
            clean = clean.replace(/\{\{[^}]*\}\}/g, '')
            clean = clean.replace(/<[^>]+>/g, '')
            clean = clean.replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
            clean = clean.replace(/\n/g, ' ')
            clean = clean.replace(/\s+/g, ' ')
            clean = clean.trim()

            // Find {{unité|...}} in original
            const uniteMatches = content.match(/\{\{unité\|([^|]*)\|([^}]*)\}\}/g)
            if (uniteMatches) {
              console.log(`   {{unité|...}} found: ${uniteMatches.join(', ')}`)
            }

            // Try to find the LSV fact text in the cleaned content
            // Look for sentences containing key words from the fact
            const keywords = text.split(' ').filter(w => w.length > 4 && !['que', 'sur', 'dans', 'avec', 'pour', 'après', 'avoir', 'été', 'faire'].includes(w.toLowerCase()))
            let foundSentence = ''

            for (const keyword of keywords) {
              const regex = new RegExp(`[^\\.]*${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\\.]*`, 'gi')
              const match = clean.match(regex)
              if (match) {
                foundSentence = match[0]
                console.log(`   Found sentence with '${keyword}': ${foundSentence.substring(0, 150)}...`)
                break
              }
            }

            if (foundSentence) {
              // Update the DB fact
              await prisma.saviezVousFact.update({
                where: { id: fact.id },
                data: { text: foundSentence },
              })
              console.log(`   ✅ Updated fact`)
            } else {
              console.log(`   ⚠️ Could not find matching sentence`)
            }
          }
        } catch (e) {
          console.log(`   ❌ Error:`, e)
        }
      }
    }
  }

  console.log('\n✅ Done!')
}

main()
  .catch(e => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
