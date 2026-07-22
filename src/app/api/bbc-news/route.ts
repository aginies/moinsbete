import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/ip'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'
import bbcNewsData from '@/data/bbc-news.json'

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

  const count = await prisma.cachedBbcArticle.count({ where: queryWhere })
  if (count === 0) return []

  const limit = 20
  const articles = await prisma.cachedBbcArticle.findMany({
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

function fetchFromJson(categories: string[]): BbcArticle[] {
  const data = bbcNewsData as Record<string, BbcArticle[]>
  
  if (categories.length === 0) {
    return data.allNews || []
  }
  
  const articles: BbcArticle[] = []
  const seenUrls = new Set<string>()
  
  for (const cat of categories) {
    if (data[cat]) {
      for (const article of data[cat]) {
        if (!seenUrls.has(article.url)) {
          seenUrls.add(article.url)
          articles.push(article)
        }
      }
    }
  }
  
  return articles
}

export async function GET(request: NextRequest) {
  const clientId = getClientIp(request)
  if (!(await checkRateLimit(`bbc-news:${clientId}`, 30, 60_000))) {
    return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const categoriesParam = searchParams.get('categories') || null
  const excludeUrl = searchParams.get('exclude') || null

  const categories = categoriesParam ? categoriesParam.split(',').filter(Boolean) : []

  // Try DB cache first
  let articles = await fetchFromCache(categories)
  
  // Fallback to JSON
  if (articles.length === 0) {
    articles = fetchFromJson(categories)
  }

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

  // Return random batch of up to 20
  const shuffled = [...articles].sort(() => Math.random() - 0.5)
  const result = shuffled.slice(0, 20)

  return NextResponse.json(result)
}
