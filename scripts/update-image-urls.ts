import 'dotenv/config'
import { PrismaClient } from '../src/generated/client'
import { cleanText, extractImageFilename, extractArticleLink, fetchPage, normalize } from './wiki-text-utils'

const prisma = new PrismaClient()

async function main() {
  console.log('📸 Matching facts to Wikipedia images\n')

  const PAGES = [
    'Wikipedia:Le_saviez-vous_?/Archives',
    'Wikipedia:Le_saviez-vous_?/Archives/2025',
    'Wikipedia:Le_saviez-vous_?/Archives/2024',
    'Wikipedia:Le_saviez-vous_?/Archives/2023',
    'Wikipedia:Le_saviez-vous_?/Archives/2022',
    'Wikipedia:Le_saviez-vous_?/Archives/2021',
  ]

  // Build a set of all cleaned fact texts from Wikipedia (for fast lookup)
  // Key: normalized text (first 50 chars), Value: { image, article }
  const textToImage = new Map<string, { image: string; article: string }>()

  for (const page of PAGES) {
    const wikitext = await fetchPage(page)
    if (!wikitext) continue

    const lines = wikitext.split('\n')
    for (const line of lines) {
      if (!line.match(/^\*\s*<!--@ID_\d+-->/)) continue

      const afterComment = line.replace(/^\*\s*<!--@ID_\d+-->\s*/, '')
      const image = extractImageFilename(afterComment)
      const article = extractArticleLink(afterComment, { skipNamespaceFilter: true }) || ''

      if (!image) continue

      const clean = cleanText(afterComment, { skipImageRemoval: true, skipTemplateExpansions: true })
      if (clean.length < 20) continue

      const norm = normalize(clean)
      textToImage.set(norm, { image, article })
    }
  }

  console.log(`Built normalized text map: ${textToImage.size} entries\n`)

  // Get facts needing update
  const facts = await prisma.saviezVousFact.findMany({
    where: { imageFilename: null },
    select: { id: true, text: true },
  })

  console.log(`Facts to update: ${facts.length}\n`)

  let updated = 0
  let errors = 0

  for (const fact of facts) {
    const normalized = normalize(fact.text)

    // Try exact match on full normalized text
    let entry = textToImage.get(normalized)

    // Try prefix match: check if fact's normalized text starts with any map key
    if (!entry) {
      const factPrefix = normalized.substring(0, 40)
      for (const [key, val] of textToImage) {
        if (key.startsWith(factPrefix) || factPrefix.startsWith(key)) {
          entry = val
          break
        }
      }
    }

    // Try first 30 chars match
    if (!entry) {
      const factShort = normalized.substring(0, 30)
      for (const [key, val] of textToImage) {
        if (key.substring(0, 30) === factShort) {
          entry = val
          break
        }
      }
    }

    if (entry) {
      try {
        const imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(entry.image)}`
        const updateData: any = { imageFilename: imageUrl }
        if (entry.article) {
          updateData.sourceUrl = `https://fr.wikipedia.org/wiki/${entry.article}`
        }
        await prisma.saviezVousFact.update({
          where: { id: fact.id },
          data: updateData,
        })
        updated++
        if (updated % 200 === 0) {
          console.log(`  Updated ${updated}...`)
        }
      } catch (e) {
        errors++
      }
    }
  }

  console.log(`\n=== Résumé ===`)
  console.log(`Updated: ${updated}`)
  console.log(`Errors: ${errors}`)

  const withImage = await prisma.saviezVousFact.count({ where: { imageFilename: { not: null } } })
  console.log(`Total with images: ${withImage}`)
}

main()
  .catch(e => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
