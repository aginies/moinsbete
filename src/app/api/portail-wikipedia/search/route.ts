import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/ip'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'

interface SearchArticle {
  id: string
  title: string
  extract: string
  imageUrl: string | null
  pageUrl: string
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10'), 1), 20)

  if (q.length < 2) {
    return NextResponse.json({ articles: [] })
  }

  try {
    const clientId = getClientIp(request)
    if (!(await checkRateLimit(`portail-wikipedia-search:${clientId}`, 20, 60_000))) {
      return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
    }

    const articles = await prisma.cachedWikipediaPortalArticle.findMany({
      where: {
        expiresAt: { gte: new Date() },
        OR: [
          { title: { contains: q } },
          { extract: { contains: q } },
        ],
      },
      select: { id: true, title: true, extract: true, imageUrl: true, pageUrl: true },
      take: limit,
    })

    return NextResponse.json({ articles: articles as SearchArticle[] })
  } catch (error) {
    console.error('Portail Wikipedia search error:', error)
    return NextResponse.json({ articles: [] })
  }
}
