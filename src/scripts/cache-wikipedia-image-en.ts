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
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const START_YEAR = 2016
const END_YEAR = 2026

function extractEntries(html: string, archive: string): ImageEntry[] {
  const entries: ImageEntry[] = []

  const datePattern = /<span class="anchor nowrap" id="(\d+)"><b>(.+?)<\/b><\/span>/g
  let dateMatch: RegExpExecArray | null

  while ((dateMatch = datePattern.exec(html)) !== null) {
    const date = dateMatch[2].trim()
    const afterDate = html.slice(dateMatch.index + dateMatch[0].length, dateMatch.index + dateMatch[0].length + 5000)

    const imgSrcMatch = afterDate.match(/src="(\/\/upload\.wikimedia\.org[^"]+)"/)
    const imgAltMatch = afterDate.match(/alt="([^"]+)"/)
    const fileHrefMatch = afterDate.match(/href="\/wiki\/File:([^"]+)"/)

    if (imgSrcMatch && imgAltMatch && fileHrefMatch) {
      let imageUrl = `https:${imgSrcMatch[1]}`
      if (imageUrl.includes('/thumb/')) {
        imageUrl = imageUrl.replace(/\/\d+px-/, '/1280px-')
      }

      entries.push({
        imageUrl,
        description: imgAltMatch[1].trim(),
        fileUrl: `https://en.wikipedia.org/wiki/File:${fileHrefMatch[1]}`,
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
      `https://en.wikipedia.org/w/api.php?action=parse&page=Wikipedia:Picture_of_the_day/${encodeURIComponent(archiveName)}&prop=text&format=json`,
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

export async function scrapeAndCacheWikipediaImagesEN(count: number = 1): Promise<void> {
  console.log('📸 Scraping Wikipedia (EN) Picture of the Day...')

  const config = await prisma.cachedConfig.findUnique({ where: { key: 'lastFetchedWikipediaMonth_en' } })
  let lastFetched: { month: number; year: number } | null = null

  if (config?.value) {
    lastFetched = nameToMonth(config.value)
  }

  if (!lastFetched || lastFetched.year > END_YEAR || (lastFetched.year === END_YEAR && lastFetched.month >= 11)) {
    lastFetched = { month: 0, year: START_YEAR }
  }

  let totalImages = 0

  for (let i = 0; i < count; i++) {
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

      const upserts = entries.map(image => ({
        where: { imageUrl_date_language: { imageUrl: image.imageUrl, date: image.date, language: 'en' } },
        update: { ...image, language: 'en', scrapedAt: now2, expiresAt },
        create: { ...image, language: 'en', scrapedAt: now2, expiresAt },
      }))
      await prisma.$transaction(upserts.map(u =>
        prisma.cachedWikipediaImage.upsert(u)
      ))

      totalImages += entries.length

      await prisma.cachedConfig.upsert({
        where: { key: 'lastFetchedWikipediaMonth_en' },
        update: { value: archiveName },
        create: { key: 'lastFetchedWikipediaMonth_en', value: archiveName },
      })
    } else {
      console.log(`  ${archiveName}: no data`)
    }

    lastFetched = { month: nextMonth, year: nextYear }

    if (i < count - 1) {
      await sleep(3000)
    }
  }

  if (totalImages > 0) {
    console.log(`  ✅ ${totalImages} images upserted (EN)`)
  }

  await cleanupExpired()
}

if (process.argv[1]?.includes('cache-wikipedia-image-en')) {
  const monthsArg = process.argv.includes('--months')
    ? parseInt(process.argv[process.argv.indexOf('--months') + 1], 10)
    : 1

  scrapeAndCacheWikipediaImagesEN(monthsArg || 1)
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
