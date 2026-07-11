import 'dotenv/config'
import { PrismaClient } from '../src/generated/client'
import { parseFacts, fetchPage } from './wiki-text-utils'

const prisma = new PrismaClient()

const ARCHIVE_URL =
  'https://fr.wikipedia.org/w/index.php?title=Wikip%C3%A9dia:Le_saviez-vous_%3F/Archives&action=raw'

// Pages to fetch (most recent first)
const PAGES = [
  'Wikipédia:Le_saviez-vous_?/Archives',
  'Wikipédia:Le_saviez-vous_?/Archives/2025',
  'Wikipédia:Le_saviez-vous_?/Archives/2024',
  'Wikipédia:Le_saviez-vous_?/Archives/2023',
  'Wikipédia:Le_saviez-vous_?/Archives/2022',
  'Wikipédia:Le_saviez-vous_?/Archives/2021',
  'Wikipédia:Le_saviez-vous_?/Archives/2020',
  'Wikipédia:Le_saviez-vous_?/Archives/2019',
  'Wikipédia:Le_saviez-vous_?/Archives/2018',
  'Wikipédia:Le_saviez-vous_?/Archives/2017',
  'Wikipédia:Le_saviez-vous_?/Archives/2016',
]

async function main() {
  console.log('📚 Scraping Wikipedia Le saviez-vous ? archives\n')

  // Get existing facts
  const existingFacts = await prisma.saviezVousFact.findMany({
    select: { text: true },
  })
  const existingTexts = new Set(existingFacts.map(f => f.text))
  console.log(`Existing facts in DB: ${existingTexts.size}\n`)

  let totalFetched = 0
  let newInserted = 0
  let duplicates = 0
  let errors = 0

  for (const page of PAGES) {
    console.log(`📄 Fetching: ${page}`)
    const wikitext = await fetchPage(page)
    if (!wikitext) continue

    const facts = await parseFacts(wikitext, {
      cleanOptions: { useDisplayText: true },
    })
    console.log(`  Found ${facts.length} facts\n`)

    for (const fact of facts) {
      totalFetched++

      if (existingTexts.has(fact.text)) {
        duplicates++
        continue
      }

      try {
        await prisma.saviezVousFact.create({
          data: {
            text: fact.text,
            sourceUrl: fact.article
              ? `https://fr.wikipedia.org/wiki/${fact.article}`
              : null,
            imageFilename: fact.image || null,
          },
        })
        newInserted++
      } catch {
        errors++
      }
    }
  }

  console.log('\n=== Résumé ===')
  console.log(`Total facts scraped: ${totalFetched}`)
  console.log(`New inserted: ${newInserted}`)
  console.log(`Duplicates skipped: ${duplicates}`)
  console.log(`Errors: ${errors}`)

  const total = await prisma.saviezVousFact.count()
  console.log(`Total in DB: ${total}`)

  const sample = await prisma.saviezVousFact.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
  })
  console.log('\n--- Recent facts ---')
  for (const f of sample) {
    console.log(f.text.substring(0, 80))
    console.log(`  URL: ${f.sourceUrl}`)
  }
}

main()
  .catch(e => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
