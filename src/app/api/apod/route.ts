import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/ip'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'
import { sanitizeUrl, apodPageUrl } from '@/lib/utils'
import { getCachedPool } from '@/lib/feed-pool-cache'
import type { CachedApodImage } from '@/generated/client'

const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY'
const FIRST_APOD_DATE = '1995-06-12'
const MAX_LOOKBACK_DAYS = 3

interface ApodApiResponse {
  date: string
  title: string
  explanation: string
  url: string
  hdurl?: string
  copyright?: string
  media_type?: string
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function isValidDateStr(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= FIRST_APOD_DATE && date <= todayStr()
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

async function fetchApodFromNasa(date: string): Promise<ApodApiResponse | null> {
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

async function upsertApod(data: ApodApiResponse): Promise<void> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  await prisma.cachedApodImage.upsert({
    where: { date: data.date },
    update: {
      title: data.title,
      explanation: data.explanation || '',
      imageUrl: data.url,
      hdImageUrl: data.hdurl || null,
      copyright: data.copyright || null,
      apodUrl: apodPageUrl(data.date),
      scrapedAt: now,
      expiresAt,
    },
    create: {
      date: data.date,
      title: data.title,
      explanation: data.explanation || '',
      imageUrl: data.url,
      hdImageUrl: data.hdurl || null,
      copyright: data.copyright || null,
      apodUrl: apodPageUrl(data.date),
      scrapedAt: now,
      expiresAt,
    },
  })
}

function toResponse(entry: {
  date: string
  title: string
  explanation: string
  imageUrl: string
  hdImageUrl: string | null
  copyright: string | null
}) {
  return NextResponse.json({
    docid: entry.date,
    titre: entry.title,
    auteur: entry.copyright || '',
    imageUrl: sanitizeUrl(entry.imageUrl, ''),
    zoomUrl: sanitizeUrl(entry.hdImageUrl, ''),
    thumbnailUrl: sanitizeUrl(entry.imageUrl, ''),
    description: entry.explanation,
    droits: 'NASA / APOD',
    link: sanitizeUrl(apodPageUrl(entry.date), ''),
    date: entry.date,
  })
}

export async function GET(request: NextRequest) {
  try {
    const clientId = getClientIp(request)
    if (!(await checkRateLimit(`apod:${clientId}`, 30, 60_000))) {
      return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
    }

    const dateParam = request.nextUrl.searchParams.get('date')
    const now = new Date()

    if (dateParam) {
      if (!isValidDateStr(dateParam)) {
        return NextResponse.json({ error: true })
      }

      const pool = await getCachedPool<CachedApodImage | null>(`apod:${dateParam}`, () =>
        prisma.cachedApodImage.findFirst({
          where: { date: dateParam, expiresAt: { gte: now } },
        })
      )

      if (pool) {
        return toResponse(pool)
      }

      const live = await fetchApodFromNasa(dateParam)
      if (live && live.media_type !== 'video') {
        await upsertApod(live)
        return toResponse({
          date: live.date,
          title: live.title,
          explanation: live.explanation || '',
          imageUrl: live.url,
          hdImageUrl: live.hdurl || null,
          copyright: live.copyright || null,
        })
      }

      return NextResponse.json({ error: true })
    }

    // No date: latest cached image date <= today
    const pool = await getCachedPool<CachedApodImage | null>('apod:latest', () =>
      prisma.cachedApodImage.findFirst({
        where: { date: { lte: todayStr() }, expiresAt: { gte: now } },
        orderBy: { date: 'desc' },
      })
    )

    if (pool) {
      return toResponse(pool)
    }

    // Cache empty: live fetch, walk back over video days
    for (let i = 0; i <= MAX_LOOKBACK_DAYS; i++) {
      const date = shiftDate(todayStr(), -i)
      const live = await fetchApodFromNasa(date)
      if (live && live.media_type !== 'video') {
        await upsertApod(live)
        return toResponse({
          date: live.date,
          title: live.title,
          explanation: live.explanation || '',
          imageUrl: live.url,
          hdImageUrl: live.hdurl || null,
          copyright: live.copyright || null,
        })
      }
    }

    return NextResponse.json({ error: true })
  } catch (error) {
    console.error('APOD error:', error)
    return NextResponse.json({ error: true })
  }
}
