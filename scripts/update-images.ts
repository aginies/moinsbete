import 'dotenv/config'
import { PrismaClient } from '../src/generated/client'
import { cleanText, extractImageFilename, extractArticleLink, fetchPage, parseFacts } from './wiki-text-utils'

const prisma = new PrismaClient()

const ARCHIVE_URL =
  'https://fr.wikipedia.org/w/index.php?title=Wikip%C3%A9dia:Le_saviez-vous_%3F/Archives&action=raw'

const PAGES = [
  'Wikipédia:Le_saviez-vous_?/Archives',
  'Wikipédia:Le_saviez-vous_?/Archives/2025',
  'Wikipédia:Le_saviez-vous_?/Archives/2024',
  'Wikipédia:Le_saviez-vous_?/Archives/2023',
  'Wikipédia:Le_saviez-vous_?/Archives/2022',
  'Wikipédia:Le_saviez-vous_?/Archives/2021',
]

async function main() {
  console.log('🖼️  Updating image filenames for existing facts\n')

  // Get all facts that don't have an image
  const factsWithoutImage = await prisma.saviezVousFact.findMany({
    where: {
      imageFilename: null,
    },
    select: {
      id: true,
      text: true,
    },
  })

  console.log(`Facts without image: ${factsWithoutImage.length}\n`)

  // Build a map of text -> fact for quick lookup
  const factMap = new Map(factsWithoutImage.map(f => [f.text, f]))

  let updated = 0
  let notFound = 0
  let errors = 0

  for (const page of PAGES) {
    console.log(`📄 Fetching: ${page}`)
    const wikitext = await fetchPage(page)
    if (!wikitext) continue

    const facts = await parseFacts(wikitext, {
      cleanOptions: { skipImageRemoval: true },
      imageOptions: { decode: true },
      articleOptions: { skipNamespaceFilter: true },
    })

    for (const fact of facts) {
      if (!factMap.has(fact.text)) {
        notFound++
        continue
      }

      if (!fact.image) {
        continue
      }

      try {
        await prisma.saviezVousFact.update({
          where: { id: factMap.get(fact.text)!.id },
          data: {
            imageFilename: fact.image,
            sourceUrl: fact.article
              ? `https://fr.wikipedia.org/wiki/${fact.article}`
              : undefined,
          },
        })
        updated++
        factMap.delete(fact.text)
      } catch {
        errors++
      }
    }
  }

  console.log('\n=== Résumé ===')
  console.log(`Updated with images: ${updated}`)
  console.log(`Not found in DB: ${notFound}`)
  console.log(`Errors: ${errors}`)
  console.log(`Still without image: ${factMap.size}`)

  const withImage = await prisma.saviezVousFact.count({
    where: { imageFilename: { not: null } },
  })
  console.log(`Total with image: ${withImage}`)
}

main()
  .catch(e => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
