import 'dotenv/config'
import { PrismaClient } from '../src/generated/client'

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
  'Wikipédia:Le_saviez-vous_?/Archives/2020',
  'Wikipédia:Le_saviez-vous_?/Archives/2019',
  'Wikipédia:Le_saviez-vous_?/Archives/2018',
  'Wikipédia:Le_saviez-vous_?/Archives/2017',
  'Wikipédia:Le_saviez-vous_?/Archives/2016',
]

function cleanText(wikiText: string): string {
  let text = wikiText
  text = text.replace(/\[\[Fichier:[^\]]*\]\]/g, '')
  text = text.replace(/\[\[Image:[^\]]*\]\]/g, '')
  text = text.replace(/\[\[([^\]|]+)(\|[^\]]*)?\]\]/g, '$1')
  text = text.replace(/'''([^']*)'''/g, '$1')
  text = text.replace(/''([^']*)''/g, '$1')
  // FIX: Handle {{unité|value|unit}} before stripping templates
  text = text.replace(/\{\{unité\|([^|]*)\|([^}]*)\}\}/g, '$1 $2')
  text = text.replace(/\{\{[^}]*\}\}/g, '')
  text = text.replace(/<[^>]+>/g, '')
  text = text.replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
  text = text.replace(/\n/g, ' ')
  text = text.replace(/\s+/g, ' ')
  text = text.trim()
  return text
}

function extractImageFilename(wikiText: string): string | null {
  const match = wikiText.match(/\[\[Fichier:([^\]]+)\]\]/)
  if (match) {
    return match[1].trim().split('|')[0]
  }
  return null
}

function extractArticleLink(wikiText: string): string | null {
  const match = wikiText.match(/\[\[([^\]|]+)\]\]/)
  if (match) {
    return match[1]
      .replace(/ /g, '_')
      .replace(/#/g, '%23')
      .replace(/'/g, '%27')
  }
  return null
}

async function fetchPage(url: string): Promise<string> {
  const encoded = encodeURIComponent(url)
  const rawUrl = `https://fr.wikipedia.org/w/index.php?title=${encoded}&action=raw`
  const res = await fetch(rawUrl, {
    headers: { 'User-Agent': 'MoinsBete/1.0 (contact: admin@stashfru.fr)' },
  })
  if (!res.ok) {
    console.log(`  ⚠️ Failed to fetch: ${url} (${res.status})`)
    return ''
  }
  return res.text()
}

async function parseFacts(wikitext: string): Promise<Array<{ text: string; image: string | null; article: string }>> {
  const facts: Array<{ text: string; image: string | null; article: string }> = []

  const lines = wikitext.split('\n')
  for (const line of lines) {
    if (!line.match(/^\*\s*<!--@ID_\d+-->/)) continue

    const afterComment = line.replace(/^\*\s*<!--@ID_\d+-->\s*/, '')
    const text = cleanText(afterComment)
    if (!text || text.length < 20) continue

    const image = extractImageFilename(afterComment)
    const article = extractArticleLink(afterComment)

    facts.push({ text, image: image || null, article: article || '' })
  }

  return facts
}

async function main() {
  console.log('📚 Re-scraping Wikipedia Le saviez-vous ? archives with fixed cleanText\n')

  const existingFacts = await prisma.saviezVousFact.findMany({
    select: { id: true, text: true, sourceUrl: true, imageFilename: true },
  })
  const existingByNormalized = new Map<string, { id: string; text: string; sourceUrl: string | null; imageFilename: string | null }>()

  function normalize(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, ' ').trim().toLowerCase()
  }

  for (const fact of existingFacts) {
    const key = fact.text  // Use exact text for comparison
    existingByNormalized.set(key, fact)
  }

  console.log(`Existing facts in DB: ${existingFacts.length}\n`)

  let totalFetched = 0
  let updated = 0
  let newFacts = 0
  let noChange = 0
  let errors = 0

  for (const page of PAGES) {
    console.log(`📄 Fetching: ${page}`)
    const wikitext = await fetchPage(page)
    if (!wikitext) continue

    const facts = await parseFacts(wikitext)
    console.log(`  Found ${facts.length} facts\n`)

    for (const fact of facts) {
      totalFetched++
      const normalized = normalize(fact.text)
      const existing = existingByNormalized.get(normalized)

      if (existing) {
        // Check if the fact text has changed (i.e., {{unité|...}} was stripped)
        if (existing.text !== fact.text) {
          console.log(`  🔄 CORRUPTED: ${existing.text.substring(0, 80)}...`)
          console.log(`     FIXED:    ${fact.text.substring(0, 80)}...`)

          // Update the fact
          try {
            await prisma.saviezVousFact.update({
              where: { id: existing.id },
              data: {
                text: fact.text,
                sourceUrl: fact.article
                  ? `https://fr.wikipedia.org/wiki/${fact.article}`
                  : existing.sourceUrl,
                imageFilename: fact.image || existing.imageFilename,
              },
            })
            updated++
          } catch (e) {
            console.error(`     ❌ Update failed:`, e)
            errors++
          }
        } else {
          noChange++
        }
      } else {
        // New fact not in DB
        try {
          await prisma.saviezVousFact.create({
            data: {
              text: fact.text,
              sourceUrl: fact.article
                ? `https://fr.wikipedia.org/wiki/${fact.article}`
                : null,
              imageFilename: fact.image,
            },
          })
          newFacts++
        } catch (e) {
          console.error(`     ❌ Create failed:`, e)
          errors++
        }
      }
    }
  }

  console.log('\n=== Résumé ===')
  console.log(`Total facts scraped: ${totalFetched}`)
  console.log(`Updated (corrupted fixed): ${updated}`)
  console.log(`New facts added: ${newFacts}`)
  console.log(`No change: ${noChange}`)
  console.log(`Errors: ${errors}`)

  const total = await prisma.saviezVousFact.count()
  console.log(`Total in DB: ${total}`)
}

main()
  .catch(e => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
