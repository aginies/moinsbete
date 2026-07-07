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
]

function cleanText(wikiText: string): string {
  let text = wikiText.replace(/\[\[([^\]|]+)(\|[^\]]*)?\]\]/g, '$1')
  text = text.replace(/'''([^']*)'''/g, '$1')
  text = text.replace(/''([^']*)''/g, '$1')
  text = text.replace(/\{\{unité\|([^|]*)\|([^}]*)\}\}/g, '$1 $2')
  text = text.replace(/\{\{[^}]*\}\}/g, '')
  text = text.replace(/<[^>]+>/g, '')
  text = text.replace(/\{\{lang\|[^\}]*\}\}/g, '')
  text = text.replace(/\{\{noble\|[^\}]*\}\}/g, '')
  text = text.replace(/\{\{s\|[^\}]*\}\}/g, '')
  text = text.replace(/\{\{nobr\|[^\}]*\}\}/g, '')
  text = text.replace(/\{\{XV\}\}/g, '15')
  text = text.replace(/\{\{VII\}\}/g, '7')
  text = text.replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
  text = text.replace(/\n/g, ' ')
  text = text.replace(/\s+/g, ' ')
  text = text.trim()
  return text
}

function extractImageFilename(wikiText: string): string | null {
  const match = wikiText.match(/\[\[Fichier:([^\]|]+)\]\]/)
  if (match) {
    return decodeURIComponent(match[1].trim())
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
    headers: { 'User-Agent': 'MoinsBête/1.0 (contact: admin@stashfru.fr)' },
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

    const facts = await parseFacts(wikitext)

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
