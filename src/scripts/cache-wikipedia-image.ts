import { prisma } from '@/lib/db'
import { sleep, cleanupExpired } from '@/lib/cache-helpers'
import { runCacheScript } from './cache-script-helper'

interface ImageEntry {
  imageUrl: string
  description: string
  fileUrl: string
  date: string
  archive: string
}

interface WikipediaImageConfig {
  lang: 'fr' | 'en'
  months: string[]
  baseUrl: string
  pagePrefix: string
  configKey: string
  filePrefix: string
  extractEntries: (html: string, archive: string) => ImageEntry[]
  logScraping: string
  logNoData: string
  logUpserted: string
}

const FR_MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function extractEntriesFR(html: string, archive: string): ImageEntry[] {
  const entries: ImageEntry[] = []
  const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi
  let h2Match: RegExpExecArray | null

  while ((h2Match = h2Regex.exec(html)) !== null) {
    const h2Content = h2Match[1]
    const dateMatch = h2Content.match(/(\d{1,2}(?:er)?\s+[a-zàâæçéèêëîïôœùûüÿ]+(?:\s+[a-zàâæçéèêëîïôœùûüÿ]+)?\s+\d{4})/i)
    if (!dateMatch) continue

    const date = dateMatch[1].replace(/<[^>]*>/g, '').trim()
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

function extractEntriesEN(html: string, archive: string): ImageEntry[] {
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

async function fetchArchive(config: WikipediaImageConfig, archiveName: string): Promise<ImageEntry[] | null> {
  try {
    const data = await fetch(
      `${config.baseUrl}/w/api.php?action=parse&page=${config.pagePrefix}/${encodeURIComponent(archiveName)}&prop=text&format=json`,
      {
        headers: { 'User-Agent': 'moinsbete/1.0 (https://moinsbete.guibo.com; bot-traffic@wikimedia.org)' },
        signal: AbortSignal.timeout(15000),
      }
    )

    if (!data.ok) return null

    const json = await data.json()
    if (!json?.parse?.text?.['*']) return null

    return config.extractEntries(json.parse.text['*'], archiveName)
  } catch {
    return null
  }
}

function monthToName(months: string[], month: number, year: number): string {
  return `${months[month]} ${year}`
}

function nameToMonth(months: string[], name: string): { month: number; year: number } | null {
  const parts = name.split(' ')
  if (parts.length !== 2) return null
  const monthIdx = months.indexOf(parts[0])
  const year = parseInt(parts[1], 10)
  if (monthIdx === -1 || isNaN(year)) return null
  return { month: monthIdx, year }
}

const START_YEAR = 2016
const END_YEAR = 2026

async function scrapeWikipediaImages(config: WikipediaImageConfig, count: number = 1): Promise<void> {
  console.log(config.logScraping)

  const dbConfig = await prisma.cachedConfig.findUnique({ where: { key: config.configKey } })
  let lastFetched: { month: number; year: number } | null = null

  if (dbConfig?.value) {
    lastFetched = nameToMonth(config.months, dbConfig.value)
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

    const archiveName = monthToName(config.months, nextMonth, nextYear)

    if (i > 0) {
      console.log(`  Fetching: ${archiveName}`)
    }

    const entries = await fetchArchive(config, archiveName)

    if (entries && entries.length > 0) {
      console.log(`  ${archiveName}: ${entries.length} images`)

      const now = new Date()
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

      const upserts = entries.map(image => ({
        where: { imageUrl_date_language: { imageUrl: image.imageUrl, date: image.date, language: config.lang } },
        update: { ...image, language: config.lang, scrapedAt: now, expiresAt },
        create: { ...image, language: config.lang, scrapedAt: now, expiresAt },
      }))
      await prisma.$transaction(upserts.map(u =>
        prisma.cachedWikipediaImage.upsert(u)
      ))

      totalImages += entries.length

      await prisma.cachedConfig.upsert({
        where: { key: config.configKey },
        update: { value: archiveName },
        create: { key: config.configKey, value: archiveName },
      })
    } else {
      console.log(`  ${archiveName}: ${config.logNoData}`)
    }

    lastFetched = { month: nextMonth, year: nextYear }

    if (i < count - 1) {
      await sleep(3000)
    }
  }

  if (totalImages > 0) {
    console.log(config.logUpserted.replace('{count}', String(totalImages)))
  }

  await cleanupExpired()
}

const FR_CONFIG: WikipediaImageConfig = {
  lang: 'fr',
  months: FR_MONTHS,
  baseUrl: 'https://fr.wikipedia.org',
  pagePrefix: 'Wikip%C3%A9dia:Image_du_jour',
  configKey: 'lastFetchedWikipediaMonth',
  filePrefix: 'Fichier',
  extractEntries: extractEntriesFR,
  logScraping: '📸 Scraping Wikipedia Image du Jour...',
  logNoData: 'aucune donnée',
  logUpserted: '  ✅ {count} images upserted au total',
}

const EN_CONFIG: WikipediaImageConfig = {
  lang: 'en',
  months: EN_MONTHS,
  baseUrl: 'https://en.wikipedia.org',
  pagePrefix: 'Wikipedia:Picture_of_the_day',
  configKey: 'lastFetchedWikipediaMonth_en',
  filePrefix: 'File',
  extractEntries: extractEntriesEN,
  logScraping: '📸 Scraping Wikipedia (EN) Picture of the Day...',
  logNoData: 'no data',
  logUpserted: '  ✅ {count} images upserted (EN)',
}

export async function scrapeAndCacheWikipediaImages(count: number = 1): Promise<void> {
  return scrapeWikipediaImages(FR_CONFIG, count)
}

export async function scrapeAndCacheWikipediaImagesEN(count: number = 1): Promise<void> {
  return scrapeWikipediaImages(EN_CONFIG, count)
}

if (process.argv[1]?.includes('cache-wikipedia-image')) {
  const isEN = process.argv[1]?.includes('cache-wikipedia-image-en')
  const fn = isEN ? scrapeAndCacheWikipediaImagesEN : scrapeAndCacheWikipediaImages
  const monthsArg = process.argv.includes('--months')
    ? parseInt(process.argv[process.argv.indexOf('--months') + 1], 10)
    : 1
  runCacheScript(() => fn(monthsArg || 1))
}
