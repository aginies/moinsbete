import { prisma } from '@/lib/db'
import { PORTAL_ARTICLE_TTL_MS, fetchArticleDetails, fetchPageWikitext } from '@/lib/portail-wikipedia-fetch'

const AIR_CRASH_PAGE = 'Air_Crash'
const AIR_CRASH_TTL_MS = PORTAL_ARTICLE_TTL_MS // 7 days
const SPECIALS_NON_ACCIDENT_LINKS = new Set(['De Havilland Comet', 'Douglas DC-7', 'Lockheed Constellation'])

function splitWikitextCells(rowText: string): string[] {
  const cells: string[] = []
  let depth = 0
  let current = ''
  for (let i = 0; i < rowText.length; i++) {
    const c = rowText[i]
    if (rowText.startsWith('[[' , i)) { depth += 1; current += '[['; i += 1; continue }
    if (rowText.startsWith(']]', i)) { depth -= 1; current += ']]'; i += 1; continue }
    if (rowText.startsWith('{{', i)) { depth += 1; current += '{{'; i += 1; continue }
    if (rowText.startsWith('}}', i)) { depth -= 1; current += '}}'; i += 1; continue }
    if (c === '<') { depth += 1; current += c; continue }
    if (c === '>') { depth = Math.max(0, depth - 1); current += c; continue }
    if (c === '|' && depth === 0) { cells.push(current); current = ''; continue }
    current += c
  }
  if (current.trim()) cells.push(current)
  return cells
}

function extractRefs(cell: string): string[] {
  const refs: string[] = []
  for (const m of cell.matchAll(/\[\[([^\]|#]+)/g)) refs.push(m[1].trim())
  for (const m of cell.matchAll(/fr=([^|}]+)/g)) refs.push(m[1].trim())
  return refs
}

export function parseAirCrashWikitext(wikitext: string): string[] {
  const start = wikitext.indexOf('== Épisodes ==')
  const end = wikitext.indexOf('== Notes et références ==')
  if (start === -1 || end === -1 || end <= start) return []
  const section = wikitext.slice(start, end)

  const byKey = new Map<string, string>()
  const add = (title: string) => {
    const t = title.trim()
    if (!t) return
    const key = t.toLowerCase()
    if (!byKey.has(key)) byKey.set(key, t)
  }

  const lines = section.split('\n')
  const rows: string[][] = []
  let current: string[] = []
  for (const line of lines) {
    if (/^\s*\|-\s*$/.test(line)) { rows.push(current); current = [] }
    else current.push(line)
  }
  rows.push(current)

  for (const row of rows) {
    const text = row.join('\n').replace(/rowspan="\d+"/g, '')
    const cells = splitWikitextCells(text).filter(c => c.trim() !== '')
    if (cells.length < 4) continue
    if (!/^\d+$/.test(cells[0].trim())) continue
    for (const ref of extractRefs(cells[2] || '')) add(ref)
  }

  const specialsStart = section.indexOf('=== Épisodes spéciaux et hors-série ===')
  if (specialsStart !== -1) {
    const specials = section.slice(specialsStart)
    for (const m of specials.matchAll(/\[\[([^\]|#]+)/g)) {
      const t = m[1].trim()
      if (!SPECIALS_NON_ACCIDENT_LINKS.has(t)) add(t)
    }
  }

  return [...byKey.values()]
}

export async function scrapeAndCacheAirCrash(): Promise<number> {
  console.log(`[cache-air-crash] Fetching wikitext from ${AIR_CRASH_PAGE}...`)
  const wikitext = await fetchPageWikitext(AIR_CRASH_PAGE)
  const titles = parseAirCrashWikitext(wikitext)
  if (titles.length === 0) throw new Error('No air crash articles parsed from wikitext')
  console.log(`[cache-air-crash] ${titles.length} air crash articles`)

  console.log(`[cache-air-crash] Fetching article details for ${titles.length} articles...`)
  const articles = await fetchArticleDetails(titles)
  console.log(`[cache-air-crash] Fetched details for ${articles.length} articles`)
  if (articles.length === 0) throw new Error('No article details fetched')

  const now = new Date()
  const expiresAt = new Date(now.getTime() + AIR_CRASH_TTL_MS)

  const BATCH_SIZE = 50
  let upserted = 0
  const totalBatches = Math.ceil(articles.length / BATCH_SIZE)

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const progress = Math.round((batchNum / totalBatches) * 100)

    console.log(`[cache-air-crash] Upserting batch ${batchNum}/${totalBatches} (${batch.length} articles) [${progress}%]`)

    try {
      await prisma.$transaction(
        batch.map(article =>
          prisma.cachedAirCrashArticle.upsert({
            where: { title: article.title },
            update: { description: article.extract, url: article.pageUrl, imageUrl: article.imageUrl, scrapedAt: now, expiresAt },
            create: { title: article.title, description: article.extract, url: article.pageUrl, imageUrl: article.imageUrl, scrapedAt: now, expiresAt },
          })
        )
      )
      upserted += batch.length
    } catch (err) {
      console.error(`[cache-air-crash] Batch ${batchNum} failed, retrying...`, err)
      await new Promise(r => setTimeout(r, 2000))
      await prisma.$transaction(
        batch.map(article =>
          prisma.cachedAirCrashArticle.upsert({
            where: { title: article.title },
            update: { description: article.extract, url: article.pageUrl, imageUrl: article.imageUrl, scrapedAt: now, expiresAt },
            create: { title: article.title, description: article.extract, url: article.pageUrl, imageUrl: article.imageUrl, scrapedAt: now, expiresAt },
          })
        )
      )
      upserted += batch.length
    }
  }

  if (articles.length >= titles.length * 0.9) {
    const validTitles = articles.map(a => a.title)
    const stale = await prisma.cachedAirCrashArticle.findMany({
      where: { title: { notIn: validTitles } },
      select: { id: true },
    })
    if (stale.length > 0) {
      await prisma.cachedAirCrashArticle.deleteMany({ where: { id: { in: stale.map(s => s.id) } } })
      console.log(`[cache-air-crash] Removed ${stale.length} stale articles`)
    }
  }

  console.log(`[cache-air-crash] Upserted ${upserted} articles total`)
  return upserted
}

// CLI entry point
if (process.argv[1]?.includes('cache-air-crash')) {
  scrapeAndCacheAirCrash()
    .then(() => {
      console.log('[cache-air-crash] Done')
      process.exit(0)
    })
    .catch((err) => {
      console.error('[cache-air-crash] Error:', err)
      process.exit(1)
    })
    .finally(() => prisma.$disconnect())
}
