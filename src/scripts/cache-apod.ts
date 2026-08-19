import { prisma } from '@/lib/db'
import { sleep } from '@/lib/cache-helpers'
import { apodPageUrl, decodeHtmlEntities } from '@/lib/utils'
import { translateEnToFr } from '@/lib/translate'
import { runCacheScript } from './cache-script-helper'

const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY'
const BACKFILL_DAYS = 30
const MIN_POOL_SIZE = 30
const TRANSLATION_BACKFILL_LIMIT = 10

interface ApodApiResponse {
  date: string
  title: string
  explanation: string
  url: string
  hdurl?: string
  copyright?: string
  media_type?: string
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return dateStr(d)
}

async function fetchApodByDate(date: string): Promise<ApodApiResponse | null> {
  try {
    const res = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(NASA_API_KEY)}&date=${date}`,
      { signal: AbortSignal.timeout(15000) }
    )
    if (!res.ok) return null
    const data = (await res.json()) as ApodApiResponse
    if (!data?.date || !data?.url || !data?.title) return null
    return data
  } catch {
    return null
  }
}

async function fetchApodRange(start: string, end: string): Promise<ApodApiResponse[]> {
  try {
    const res = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(NASA_API_KEY)}&start_date=${start}&end_date=${end}`,
      { signal: AbortSignal.timeout(30000) }
    )
    if (!res.ok) return []
    const data = (await res.json()) as ApodApiResponse[]
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

async function upsertApod(data: ApodApiResponse): Promise<boolean> {
  if (data.media_type === 'video') return false
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const title = decodeHtmlEntities(data.title)
  const explanation = decodeHtmlEntities(data.explanation || '')
  const copyright = data.copyright ? decodeHtmlEntities(data.copyright) : null
  await prisma.cachedApodImage.upsert({
    where: { date: data.date },
    update: {
      title,
      explanation,
      imageUrl: data.url,
      hdImageUrl: data.hdurl || null,
      copyright,
      apodUrl: apodPageUrl(data.date),
      scrapedAt: now,
      expiresAt,
    },
    create: {
      date: data.date,
      title,
      explanation,
      imageUrl: data.url,
      hdImageUrl: data.hdurl || null,
      copyright,
      apodUrl: apodPageUrl(data.date),
      scrapedAt: now,
      expiresAt,
    },
  })
  return true
}

function needsTranslation(value: string | null): boolean {
  return value === null || value.includes('&#')
}

async function ensureApodTranslation(date: string, title: string, explanation: string): Promise<void> {
  const existing = await prisma.cachedApodImage.findUnique({ where: { date } })
  if (!existing) return
  const needTitle = needsTranslation(existing.titleFr)
  const needExplanation = needsTranslation(existing.explanationFr)
  if (!needTitle && !needExplanation) return

  const updates: { titleFr?: string; explanationFr?: string } = {}
  if (needTitle) {
    const translated = await translateEnToFr(title)
    if (translated) updates.titleFr = translated
  }
  if (needExplanation) {
    const translated = await translateEnToFr(explanation)
    if (translated) updates.explanationFr = translated
  }

  if (Object.keys(updates).length > 0) {
    await prisma.cachedApodImage.update({ where: { date }, data: updates })
    console.log(`  ${date}: FR translation stored`)
  } else {
    console.log(`  ${date}: FR translation failed, will retry next run`)
  }
}

async function backfillApodTranslations(): Promise<void> {
  const missing = await prisma.cachedApodImage.findMany({
    where: {
      expiresAt: { gte: new Date() },
      OR: [
        { explanationFr: null },
        { titleFr: { contains: '&#' } },
        { explanationFr: { contains: '&#' } },
      ],
    },
    orderBy: { date: 'desc' },
    take: TRANSLATION_BACKFILL_LIMIT,
  })
  if (missing.length === 0) return
  console.log(`  Translating ${missing.length} cached images to FR...`)
  for (const row of missing) {
    await ensureApodTranslation(row.date, row.title, row.explanation)
    await sleep(1000)
  }
}

export async function scrapeAndCacheApod(): Promise<void> {
  console.log('🔭 Scraping APOD (NASA)...')

  const count = await prisma.cachedApodImage.count()
  let total = 0

  if (count < MIN_POOL_SIZE) {
    console.log(`  Pool small (${count} < ${MIN_POOL_SIZE}), backfilling last ${BACKFILL_DAYS} days...`)
    const batch = await fetchApodRange(daysAgo(BACKFILL_DAYS), dateStr(new Date()))
    for (const item of batch) {
      if (await upsertApod(item)) total++
    }
    console.log(`  Backfill: ${total} images upserted`)
    await sleep(2000)
  }

  const today = dateStr(new Date())
  const yesterday = daysAgo(1)

  for (const date of [today, yesterday]) {
    const existing = await prisma.cachedApodImage.findUnique({ where: { date } })
    if (existing) continue
    const item = await fetchApodByDate(date)
    if (item && (await upsertApod(item))) {
      total++
      console.log(`  ${date}: ${item.title}`)
      await ensureApodTranslation(date, decodeHtmlEntities(item.title), decodeHtmlEntities(item.explanation || ''))
    } else {
      console.log(`  ${date}: skipped (video or unavailable)`)
    }
    await sleep(2000)
  }

  await backfillApodTranslations()

  console.log(`  ✅ ${total} APOD images upserted`)
}

if (process.argv[1]?.includes('cache-apod')) {
  runCacheScript(() => scrapeAndCacheApod())
}
