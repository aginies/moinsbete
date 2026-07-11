import 'dotenv/config'
import { PrismaClient } from '../src/generated/client'
import { normalize, cleanText } from './wiki-text-utils'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Finding corrupted facts...\n')

  // Find facts with suspicious gaps that suggest missing {{unité|...}} content
  const corruptedFacts = await prisma.saviezVousFact.findMany({
    where: {
      OR: [
        { text: { contains: 'environ sur' } },
        { text: { contains: 'gravé il y a environ sur' } },
        { text: { contains: 'environ surveillés' } },
        { text: { contains: 'de %' } },
        { text: { contains: 'de  %' } },
        { text: { contains: 'de %s' } },
        { text: { contains: 'de %kg' } },
        { text: { contains: 'de %m%s' } },
        { text: { contains: 'de %km' } },
        { text: { contains: 'de %litre' } },
        { text: { contains: 'de %°C' } },
        { text: { contains: 'de %°F' } },
        { text: { contains: 'de %h' } },
        { text: { contains: 'de %min' } },
      ]
    },
    select: { id: true, text: true, sourceUrl: true, imageFilename: true },
  })

  console.log(`Found ${corruptedFacts.length} potentially corrupted facts\n`)

  for (const fact of corruptedFacts) {
    const normalizedFact = normalize(fact.text)
    console.log(`\n--- Fact: ${fact.text.substring(0, 80)}...`)
    console.log(`   Source: ${fact.sourceUrl}`)

    if (fact.sourceUrl && fact.sourceUrl.includes('wikipedia.org')) {
      // Extract page title from URL
      const urlMatch = fact.sourceUrl.match(/wikipedia\.org\/wiki\/(.+)/)
      if (urlMatch) {
        const pageTitle = decodeURIComponent(urlMatch[1])
        console.log(`   Page: ${pageTitle}`)

        // Fetch page content
        const encodedTitle = encodeURIComponent(pageTitle)
        const apiUrl = `https://fr.wikipedia.org/w/api.php?action=query&titles=${encodedTitle}&prop=revisions&rvprop=content&format=json`

        try {
          const res = await fetch(apiUrl)
          const data = await res.json()
          const pages = data.query.pages
          const page = Object.values(pages)[0] as any

          if (page && page.revisions && page.revisions[0]) {
            const content = page.revisions[0]['*']
            console.log(`   Content length: ${content.length}`)

            // Try to find the original text with {{unité|...}}
            const uniteMatch = content.match(/\{\{unité\|([^|]*)\|([^}]*)\}\}/g)
            if (uniteMatch) {
              console.log(`   Found {{unité|...}} templates:`, uniteMatch)
            }

            // Apply the fixed cleanText
            let cleanedText = cleanText(content, { skipTemplateExpansions: true })

            console.log(`   Cleaned text: ${cleanedText.substring(0, 200)}...`)
          }
        } catch (e) {
          console.log(`   Error fetching page:`, e)
        }
      }
    }
  }
}

main()
  .catch(e => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
