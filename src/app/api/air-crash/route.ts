import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/ip'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'
import { getCachedPool } from '@/lib/feed-pool-cache'
import { shuffle } from '@/lib/utils'
import type { CachedAirCrashArticle } from '@/generated/client'

interface AirCrashItem {
  id: string
  title: string
  description: string
  url: string
  imageUrl: string | null
}

export async function GET(request: NextRequest) {
  try {
    const clientId = getClientIp(request)
    if (!(await checkRateLimit(`air-crash:${clientId}`, 30, 60_000))) {
      return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
    }

    const now = new Date()
    const pool = await getCachedPool<CachedAirCrashArticle[]>(
      'air-crash:pool',
      () => prisma.cachedAirCrashArticle.findMany({
        where: { expiresAt: { gte: new Date() } },
        orderBy: { scrapedAt: 'desc' },
        take: 100,
      })
    )
    const valid = pool.filter(a => a.expiresAt >= now)
    const [article] = shuffle(valid).slice(0, 1)

    if (!article) {
      return NextResponse.json({ article: null })
    }

    const item: AirCrashItem = {
      id: article.id,
      title: article.title,
      description: article.description,
      url: article.url,
      imageUrl: article.imageUrl,
    }
    return NextResponse.json({ article: item })
  } catch (error) {
    console.error('Air crash API error:', error)
    return NextResponse.json({ article: null })
  }
}
