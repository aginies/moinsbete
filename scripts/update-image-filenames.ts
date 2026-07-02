import 'dotenv/config'
import { PrismaClient } from '../src/generated/client'

const prisma = new PrismaClient()

const PAGES = [
  'Wikipedia:Le_saviez-vous_?/Archives',
  'Wikipedia:Le_saviez-vous_?/Archives/2025',
  'Wikipedia:Le_saviez-vous_?/Archives/2024',
  'Wikipedia:Le_saviez-vous_?/Archives/2023',
  'Wikipedia:Le_saviez-vous_?/Archives/2022',
  'Wikipedia:Le_saviez-vous_?/Archives/2021',
]

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
  if (!res.ok) return ''
  return res.text()
}

async function main() {
  console.log('📸 Extracting image filenames from Wikipedia archives\n')

  // Get facts without imageFilename
  const factsWithoutImage = await prisma.saviezVousFact.findMany({
    where: { imageFilename: null },
    select: { id: true, text: true },
    take: 50,
  })
  console.log(`Sample facts without images: ${factsWithoutImage.length}\n`)

  // Build a map of fact text -> update needed
  const allFacts = await prisma.saviezVousFact.findMany({
    where: { imageFilename: null },
    select: { id: true, text: true },
  })
  console.log(`Facts needing image update: ${allFacts.length}\n`)

  let updated = 0
  let errors = 0

  for (const page of PAGES) {
    console.log(`📄 Processing: ${page}`)
    const wikitext = await fetchPage(page)
    if (!wikitext) continue

    const lines = wikitext.split('\n')
    for (const line of lines) {
      if (!line.match(/^\*\s*<!--@ID_\d+-->/)) continue

      const afterComment = line.replace(/^\*\s*<!--@ID_\d+-->\s*/, '')
      const image = extractImageFilename(afterComment)
      const article = extractArticleLink(afterComment)

      if (!image) continue

      const cleanText = afterComment
        .replace(/\[\[Fichier:[^\]]*\]\]/g, '')
        .replace(/\[\[([^\]|]+)(\|[^\]]*)?\]\]/g, '$1')
        .replace(/'''([^']*)'''/g, '$1')
        .replace(/''([^']*)''/g, '$1')
        .replace(/\{\{[^}]*\}\}/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      if (cleanText.length < 20) continue

      // Find matching fact
      const fact = allFacts.find(f => {
        const normalizedFact = f.text.replace(/\s+/g, ' ').trim()
        const normalizedClean = cleanText.replace(/\s+/g, ' ').trim()
        return normalizedFact.length > 20 && normalizedClean.length > 20 && (
          normalizedFact === normalizedClean ||
          normalizedFact.startsWith(normalizedClean.substring(0, 50)) ||
          normalizedClean.startsWith(normalizedFact.substring(0, 50))
        )
      })

      if (fact) {
        try {
          // Store Wikimedia Commons URL, not just filename
          const imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fact.imageFilename as string)}`
          const updateData: any = { imageFilename: imageUrl }
          if (article) {
            updateData.sourceUrl = `https://fr.wikipedia.org/wiki/${article}`
          }
          await prisma.saviezVousFact.update({
            where: { id: fact.id },
            data: updateData,
          })
          updated++
        } catch (e) {
          errors++
        }
      }
    }
  }

  console.log(`\n=== Résumé ===`)
  console.log(`Updated with images: ${updated}`)
  console.log(`Errors: ${errors}`)

  const withImage = await prisma.saviezVousFact.count({ where: { imageFilename: { not: null } } })
  console.log(`Total with images: ${withImage}`)
  console.log(`Total without images: ${allFacts.length - updated}`)
}

main()
  .catch(e => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
