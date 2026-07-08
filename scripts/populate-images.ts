import 'dotenv/config'
import { PrismaClient } from '../src/generated/client'

const prisma = new PrismaClient()

async function extractImageFromWiki(articleTitle: string): Promise<string | null> {
  const encoded = encodeURIComponent(articleTitle)
  const url = `https://fr.wikipedia.org/w/api.php?action=query&titles=${encoded}&prop=pageimages&pithumbsize=400&format=json&origin=*`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'moinsbete/1.0 (contact: antoine@ginies.org)' },
    })
    const data = await res.json()
    const pages = data?.query?.pages || {}
    for (const pageId of Object.keys(pages)) {
      const page = pages[pageId]
      if (page?.thumbnail?.source) {
        return page.thumbnail.source
      }
    }
  } catch {
    // ignore
  }
  return null
}

async function main() {
  console.log('🖼️  Adding images from Wikipedia articles\n')

  // Get all facts with a Wikipedia source URL but no image
  const facts = await prisma.saviezVousFact.findMany({
    where: {
      imageFilename: null,
      sourceUrl: { not: null },
    },
    select: { id: true, sourceUrl: true },
  })

  console.log(`Facts with source URL but no image: ${facts.length}\n`)

  let updated = 0
  let failed = 0
  let noImage = 0

  for (let i = 0; i < facts.length; i++) {
    if (i > 0 && i % 50 === 0) {
      console.log(`  Progress: ${i}/${facts.length}`)
    }

    const url = facts[i].sourceUrl!
    // Extract article title from URL
    const match = url.match(/\/wiki\/(.+)$/)
    if (!match) {
      failed++
      continue
    }

    const articleTitle = decodeURIComponent(match[1])
      .replace(/_/g, ' ')
      // Remove disambiguation suffix
      .replace(/\(disambiguation\)/gi, '')

    const imageUrl = await extractImageFromWiki(articleTitle)

    if (imageUrl) {
      await prisma.saviezVousFact.update({
        where: { id: facts[i].id },
        data: { imageFilename: imageUrl },
      })
      updated++
    } else {
      noImage++
    }

    // Rate limit
    if (i % 10 === 0 && i > 0) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  console.log('\n=== Résumé ===')
  console.log(`Updated with images: ${updated}`)
  console.log(`No image found: ${noImage}`)
  console.log(`Failed: ${failed}`)

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
