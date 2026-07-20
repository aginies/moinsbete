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

const START_YEAR = 2016
const END_YEAR = 2026

function extractEntries(html: string, archive: string): ImageEntry[] {
  const entries: ImageEntry[] = []
  const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi
  let h2Match: RegExpExecArray | null

  while ((h2Match = h2Regex.exec(html)) !== null) {
    const h2Content = h2Match[1]
    const dateMatch = h2Content.match(/(\d{1,2}(?:er)?\s+[a-zàâæçéèêëîïôœùûüÿ]+(?:\s+[a-zàâæçéèêëîïôœùûüÿ]+)?\s+\d{4})/i)
    if (!dateMatch) continue

    const date = dateMatch[1].replace(/<[^>]*>/g, '').trim()
    // Search in a larger context after the h2 tag
    const afterH2 = html.slice(h2Match.index + h2Match[0].length, h2Match.index + h2Match[0].length + 5000)

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

function monthToName(month: number, year: number): string {
  return `${MONTHS[month]} ${year}`
}

function nameToMonth(name: string): { month: number; year: number } | null {
  const parts = name.split(' ')
  if (parts.length !== 2) return null
  const monthIdx = MONTHS.indexOf(parts[0])
  const year = parseInt(parts[1], 10)
  if (monthIdx === -1 || isNaN(year)) return null
  return { month: monthIdx, year }
}

export async function scrapeAndCacheWikipediaImages(count: number = 1): Promise<void> {
  console.log('📸 Scraping Wikipedia Image du Jour...')
  
  // Get last fetched month from config
  const config = await prisma.cachedConfig.findUnique({ where: { key: 'lastFetchedWikipediaMonth' } })
  let lastFetched: { month: number; year: number } | null = null
  
  if (config?.value) {
    lastFetched = nameToMonth(config.value)
  }
  
  if (!lastFetched || lastFetched.year > END_YEAR || (lastFetched.year === END_YEAR && lastFetched.month >= 11)) {
    lastFetched = { month: 0, year: START_YEAR }
  }
  
  let totalImages = 0
  
  for (let i = 0; i < count; i++) {
    // Calculate next month
    let nextMonth: number
    let nextYear: number
    
    if (lastFetched) {
      nextMonth = lastFetched.month + 1
      nextYear = lastFetched.year
    } else {
      nextMonth = 0
      nextYear = START_YEAR
    }
    
    if (nextMonth > 11) {
      nextMonth = 0
      nextYear++
    }
    
    // If we've gone past END_YEAR, reset to START_YEAR
    if (nextYear > END_YEAR) {
      nextMonth = 0
      nextYear = START_YEAR
    }
    
    const archiveName = monthToName(nextMonth, nextYear)
    
    if (i > 0) {
      console.log(`  Fetching: ${archiveName}`)
    }
    
    const entries = await fetchArchive(archiveName)
    
    if (entries && entries.length > 0) {
      console.log(`  ${archiveName}: ${entries.length} images`)
      
      const now2 = new Date()
      const expiresAt = new Date(now2.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      
      for (const image of entries) {
        await prisma.cachedWikipediaImage.upsert({
          where: { imageUrl_date: { imageUrl: image.imageUrl, date: image.date } },
          update: { ...image, scrapedAt: now2, expiresAt },
          create: { ...image, scrapedAt: now2, expiresAt },
        })
      }
      
      totalImages += entries.length
      
      // Update last fetched month
      await prisma.cachedConfig.upsert({
        where: { key: 'lastFetchedWikipediaMonth' },
        update: { value: archiveName },
        create: { key: 'lastFetchedWikipediaMonth', value: archiveName },
      })
    } else {
      console.log(`  ${archiveName}: aucune donnée`)
    }
    
    lastFetched = { month: nextMonth, year: nextYear }
    
    if (i < count - 1) {
      await sleep(3000)
    }
  }
  
  if (totalImages > 0) {
    console.log(`  ✅ ${totalImages} images upserted au total`)
  }
  
  await cleanupExpired()
}

if (process.argv[1]?.includes('cache-wikipedia-image')) {
  const monthsArg = process.argv.includes('--months')
    ? parseInt(process.argv[process.argv.indexOf('--months') + 1], 10)
    : 1
  
  scrapeAndCacheWikipediaImages(monthsArg || 1)
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
