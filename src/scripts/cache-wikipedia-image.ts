import { prisma } from '../lib/db'
import { sleep, cleanupExpired } from '../lib/cache-helpers'

interface ImageEntry {
  imageUrl: string
  description: string
  fileUrl: string
  date: string
  archive: string
}

const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

function extractEntries(html: string, archive: string): ImageEntry[] {
  const entries: ImageEntry[] = []
  const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/g
  let h2Match: RegExpExecArray | null

  while ((h2Match = h2Regex.exec(html)) !== null) {
    const h2Content = h2Match[1]
    const dateMatch = h2Content.match(/(\d{1,2}(?:er)?\s+\w+\s+\d{4})/)
    if (!dateMatch) continue

    const date = dateMatch[1].replace(/<[^>]*>/g, '').trim()
    const afterH2 = html.slice(h2Match.index + h2Match[0].length)

    const imgSrcMatch = afterH2.match(/src="(\/\/upload\.wikimedia\.org[^"]+)"/)
    const imgAltMatch = afterH2.match(/alt="([^"]+)"/)
    const fileHrefMatch = afterH2.match(/href="\/wiki\/Fichier:([^"]+)"/)

    if (imgSrcMatch && imgAltMatch && fileHrefMatch) {
      let imageUrl = `https:${imgSrcMatch[1]}`
      if (imageUrl.includes('/thumb/')) {
        imageUrl = imageUrl.replace(/\/\d+px-/, '/1280px-')
      }

      entries.push({
        imageUrl,
        description: imgAltMatch[1].replace(/\s*\([^)]*définition réelle[^)]*\)/, '').trim(),
        fileUrl: `https://fr.wikipedia.org/wiki/Fichier:${fileHrefMatch[1]}`,
        date,
        archive,
      })
    }

    if (entries.length >= 31) break
  }

  return entries
}

async function fetchArchive(archiveName: string): Promise<ImageEntry[] | null> {
  try {
    const data = await fetch(
      `https://fr.wikipedia.org/w/api.php?action=parse&page=Wikip%C3%A9dia:Image_du_jour/${encodeURIComponent(archiveName)}&prop=text&format=json`,
      {
        headers: { 'User-Agent': 'moinsbete/1.0 (https://moinsbete.guibo.com; bot-traffic@wikimedia.org)' },
        signal: AbortSignal.timeout(15000),
      }
    )
    
    if (!data.ok) return null
    
    const json = await data.json()
    if (!json?.parse?.text?.['*']) return null
    
    return extractEntries(json.parse.text['*'], archiveName)
  } catch {
    return null
  }
}

export async function scrapeAndCacheWikipediaImages(): Promise<void> {
  console.log('📸 Scraping Wikipedia Image du Jour...')
  const now = new Date()
  const allImages: ImageEntry[] = []
  
  // Fetch last 12 months of archives (production mode)
  for (let monthsAgo = 0; monthsAgo < 12; monthsAgo++) {
    const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1)
    const archiveName = `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
    
    const entries = await fetchArchive(archiveName)
    if (entries && entries.length > 0) {
      allImages.push(...entries)
      console.log(`  ${archiveName}: ${entries.length} images`)
    } else {
      console.log(`  ${archiveName}: aucune donnée`)
    }
    
    await sleep(500)
  }

  if (allImages.length === 0) {
    console.log('⚠️ Aucune image trouvée')
    return
  }

  console.log(`\n💾 Upsert ${allImages.length} images en DB...`)
  const now2 = new Date()
  const expiresAt = new Date(now2.getTime() + 30 * 24 * 60 * 60 * 1000)

  let created = 0
  let updated = 0
  for (const image of allImages) {
    await prisma.cachedWikipediaImage.upsert({
      where: { imageUrl_date: { imageUrl: image.imageUrl, date: image.date } },
      update: { ...image, scrapedAt: now2, expiresAt },
      create: { ...image, scrapedAt: now2, expiresAt },
    })
    updated++
  }
  
  console.log(`  ✅ ${allImages.length} images upserted`)
  await cleanupExpired()
}

if (process.argv[1]?.includes('cache-wikipedia-image')) {
  scrapeAndCacheWikipediaImages()
    .then(() => {
      console.log('Done!')
      process.exit(0)
    })
    .catch(e => {
      console.error('Erreur:', e)
      process.exit(1)
    })
    .finally(() => prisma.$disconnect())
}
