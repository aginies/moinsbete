import 'dotenv/config'
import { PrismaClient } from '../src/generated/client'

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

function cleanText(wikiText: string): string {
  let text = wikiText
  // Remove images/files FIRST (before other replacements)
  text = text.replace(/\[\[Fichier:[^\]]*\]\]/g, '')
  text = text.replace(/\[\[Image:[^\]]*\]\]/g, '')
  // Remove wiki links [[...]]
  text = text.replace(/\[\[([^\]|]+)(\|[^\]]*)?\]\]/g, '$1')
  // Remove bold/italic
  text = text.replace(/'''([^']*)'''/g, '$1')
  text = text.replace(/''([^']*)''/g, '$1')
  // Remove templates {{...}}
  text = text.replace(/\{\{unité\|([^|]*)\|([^}]*)\}\}/g, '$1 $2')
  text = text.replace(/\{\{[^}]*\}\}/g, '')
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, '')
  // Remove language tags
  text = text.replace(/\{\{lang\|[^\}]*\}\}/g, '')
  text = text.replace(/\{\{noble\|[^\}]*\}\}/g, '')
  text = text.replace(/\{\{s\|[^\}]*\}\}/g, '')
  text = text.replace(/\{\{nobr\|[^\}]*\}\}/g, '')
  text = text.replace(/\{\{XV\}\}/g, '15')
  text = text.replace(/\{\{VII\}\}/g, '7')
  // Remove references <ref>
  text = text.replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
  // Clean whitespace
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
    headers: { 'User-Agent': 'moinsbete/1.0 (contact: antoine@ginies.org)' },
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
    // Match fact lines: * <!--@ID_xxxxx-->fact text
    if (!line.match(/^\*\s*<!--@ID_\d+-->/)) continue

    // Remove the ID comment
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

    const facts = await parseFacts(wikitext)
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
            imageFilename: fact.image,
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
