import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/ip'
import { RATE_LIMIT_ERROR_MESSAGE, NEWS_DISPLAY_LIMIT } from '@/lib/constants'

interface BbcArticle {
  title: string
  description: string
  url: string
  imageUrl?: string
  source: string
  category: string
  publishedAt: string
}

async function fetchFromCache(categories: string[]): Promise<BbcArticle[]> {
  const now = new Date()
  const queryWhere: { expiresAt: { gte: Date }; category?: string | { in: string[] } } = {
    expiresAt: { gte: now },
  }
  if (categories.length > 0) {
    queryWhere.category = { in: categories }
  }

   const count = await prisma.cachedNewsArticle.count({ where: queryWhere })
  if (count === 0) return []

  const limit = 250
   const articles = await prisma.cachedNewsArticle.findMany({
    where: queryWhere,
    take: limit,
    orderBy: { scrapedAt: 'desc' },
  })

  return articles.map(a => ({
    title: a.title,
    description: a.description || '',
    url: a.url,
    imageUrl: a.imageUrl || undefined,
    source: a.source,
    category: a.category,
    publishedAt: a.publishedAt?.toISOString() || '',
  }))
}

export async function GET(request: NextRequest) {
  const clientId = getClientIp(request)
  if (!(await checkRateLimit(`news:${clientId}`, 30, 60_000))) {
    return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const categoriesParam = searchParams.get('categories') || null
  const excludeUrl = searchParams.get('exclude') || null

  const categories = categoriesParam ? categoriesParam.split(',').filter(Boolean) : []

  let articles = await fetchFromCache(categories)

  if (articles.length === 0) {
    return NextResponse.json([])
  }

  // Filter out excluded
  if (excludeUrl) {
    articles = articles.filter(a => a.url !== excludeUrl)
  }

  if (articles.length === 0) {
    return NextResponse.json([])
  }

  // Return random batch of NEWS_DISPLAY_LIMIT
  const shuffled = [...articles].sort(() => Math.random() - 0.5)
  const result = shuffled.slice(0, NEWS_DISPLAY_LIMIT)

  return NextResponse.json(result)
}
