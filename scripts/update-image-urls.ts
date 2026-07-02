import 'dotenv/config'
import { PrismaClient } from '../src/generated/client'

const prisma = new PrismaClient()

async function fetchPage(url: string): Promise<string> {
  const encoded = encodeURIComponent(url)
  const rawUrl = `https://fr.wikipedia.org/w/index.php?title=${encoded}&action=raw`
  const res = await fetch(rawUrl, {
    headers: { 'User-Agent': 'MoinsBete/1.0 (contact: admin@stashfru.fr)' },
  })
  if (!res.ok) return ''
  return res.text()
}

function extractImageFilename(wikiText: string): string | null {
  const match = wikiText.match(/\[\[Fichier:([^\]]+)\]\]/)
  if (match) return match[1].trim().split('|')[0]
  return null
}

function extractArticleLink(wikiText: string): string | null {
  const match = wikiText.match(/\[\[([^\]|]+)\]\]/)
  if (match) return match[1].replace(/ /g, '_').replace(/#/g, '%23').replace(/'/g, '%27')
  return null
}

function cleanText(wikiText: string): string {
  let text = wikiText
  text = text.replace(/\[\[Fichier:[^\]]*\]\]/g, '')
  text = text.replace(/\[\[([^\]|]+)(\|[^\]]*)?\]\]/g, '$1')
  text = text.replace(/'''([^']*)'''/g, '$1')
  text = text.replace(/''([^']*)''/g, '$1')
  text = text.replace(/\{\{[^}]*\}\}/g, '')
  text = text.replace(/<[^>]+>/g, '')
  text = text.replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
  text = text.replace(/\n/g, ' ')
  text = text.replace(/\s+/g, ' ')
  return text.trim()
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, ' ').trim().toLowerCase()
}

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
      const article = extractArticleLink(afterComment)

      if (!image) continue

      const clean = cleanText(afterComment)
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
