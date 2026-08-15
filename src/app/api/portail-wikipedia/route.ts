import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/ip'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'
import { getCachedPool } from '@/lib/feed-pool-cache'
import { PORTAL_PAGES, PORTAL_ARTICLE_TTL_MS, fetchArticleDetails, fetchLinksFromPortal, type PortalArticleData } from '@/lib/portail-wikipedia-fetch'
import articlesFallback from '@/data/portail-wikipedia.json'

interface PortalPoolRow {
  id: string
  title: string | null
  extract: string | null
  imageUrl: string | null
  pageUrl: string | null
  expiresAt: Date
}

function getRandomArticles(count: number): PortalArticleData[] {
  const pool = [...articlesFallback]
  const result: PortalArticleData[] = []
  while (result.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length)
    result.push(pool.splice(idx, 1)[0])
  }
  return result
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const count = Math.min(Math.max(parseInt(searchParams.get('count') || '10'), 1), 20)

  try {
    const clientId = getClientIp(request)
    if (!(await checkRateLimit(`portail-wikipedia:${clientId}`, 30, 60_000))) {
      return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
    }

    const now = new Date()
    const pool = await getCachedPool<PortalPoolRow[]>('portail-wiki:all', () =>
      prisma.cachedWikipediaPortalArticle.findMany({
        where: { expiresAt: { gte: new Date() } },
        select: { id: true, title: true, extract: true, imageUrl: true, pageUrl: true, expiresAt: true },
      })
    )
    const valid = pool.filter(a => a.expiresAt >= now)

    if (valid.length >= count) {
      const skip = Math.floor(Math.random() * Math.max(valid.length - count + 1, 0))
      const articles = valid.slice(skip, skip + count).map(({ expiresAt: _e, ...a }) => a)
      if (articles.length > 0) {
        return NextResponse.json(articles)
      }
    } else if (valid.length > 0) {
      const articles = valid.map(({ expiresAt: _e, ...a }) => a)
      if (articles.length > 0) {
        return NextResponse.json(articles)
      }
    }

    // Cache empty — try fetching from portal pages
    let allLinks: string[] = []
    for (const page of PORTAL_PAGES) {
      const links = await fetchLinksFromPortal(page)
      allLinks = allLinks.concat(links)
    }

    // Remove duplicates
    allLinks = [...new Set(allLinks)]

    if (allLinks.length > 0) {
      // Fetch details for all links
      const articles = await fetchArticleDetails(allLinks)

      // Upsert to DB
      const now = new Date()
      const expiresAt = new Date(now.getTime() + PORTAL_ARTICLE_TTL_MS)

      for (const article of articles) {
        await prisma.cachedWikipediaPortalArticle.upsert({
          where: { id: article.id },
          update: { title: article.title, extract: article.extract, imageUrl: article.imageUrl, pageUrl: article.pageUrl, scrapedAt: now, expiresAt },
          create: { id: article.id, title: article.title, extract: article.extract, imageUrl: article.imageUrl, pageUrl: article.pageUrl, scrapedAt: now, expiresAt },
        })
      }

      // Return random batch
      const result = getRandomArticles(count)
      return NextResponse.json(result)
    }

    // All failed — return fallback
    return NextResponse.json(getRandomArticles(count))
  } catch (error) {
    console.error('Portail Wikipedia error:', error)
    return NextResponse.json(getRandomArticles(count))
  }
}
