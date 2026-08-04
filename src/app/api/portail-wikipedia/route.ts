import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/ip'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'
import articlesFallback from '@/data/portail-wikipedia.json'

interface ArticleData {
  id: string
  title: string
  extract: string
  imageUrl: string | null
  pageUrl: string
}

const PORTAL_PAGES = [
  'Wikipédia:Contenus_de_qualité',
  'Wikipédia:Bons_contenus',
]

const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function getRandomArticles(count: number): ArticleData[] {
  const pool = [...articlesFallback]
  const result: ArticleData[] = []
  while (result.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length)
    result.push(pool.splice(idx, 1)[0])
  }
  return result
}

async function fetchArticleDetails(titles: string[]): Promise<ArticleData[]> {
  if (titles.length === 0) return []

  const BATCH_SIZE = 50
  const allResults: ArticleData[] = []

  for (let i = 0; i < titles.length; i += BATCH_SIZE) {
    const batch = titles.slice(i, i + BATCH_SIZE)
    const escapedTitles = batch.map(t => encodeURIComponent(t)).join('|')
    const url = `https://fr.wikipedia.org/w/api.php?action=query&titles=${escapedTitles}&prop=pageimages|extracts&piprop=thumbnail&pithumbsize=400&exintro=true&explaintext=true&format=json`

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'moinsbete (https://moinsbete.guibo.com; bot-traffic@wikimedia.org)' },
        signal: AbortSignal.timeout(30000),
      })
      if (!res.ok) continue

      const data = await res.json()
      const pages = data?.query?.pages
      if (!pages) continue

      for (const pageId of Object.keys(pages)) {
        const page = pages[pageId]
        if (page.missing) continue

        const title = page.title || ''
        const extract = page.extract || ''
        const imageUrl = page.thumbnail?.source || null
        const pageUrl = `https://fr.wikipedia.org/wiki/${encodeURIComponent(title)}`

        allResults.push({
          id: pageId,
          title,
          extract: extract.replace(/\s+/g, ' ').trim(),
          imageUrl,
          pageUrl,
        })
      }
    } catch {
      // Skip failed batches
    }
  }

  return allResults
}

async function fetchLinksFromPortal(pageTitle: string): Promise<string[]> {
  let allLinks: string[] = []
  let plcontinue: string | null = null
  let url: string

  while (true) {
    url = `https://fr.wikipedia.org/w/api.php?action=query&prop=links&titles=${encodeURIComponent(pageTitle)}&pllimit=500&format=json${plcontinue ? `&plcontinue=${encodeURIComponent(plcontinue)}` : ''}`
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'moinsbete (https://moinsbete.guibo.com; bot-traffic@wikimedia.org)' },
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) break

      const data = await res.json()
      const pages = data?.query?.pages
      if (!pages) break

      for (const pageId of Object.keys(pages)) {
        const page = pages[pageId]
        if (page.links) {
          allLinks = allLinks.concat(page.links.map((l: { title: string }) => l.title))
        }
      }
      plcontinue = data?.continue?.plcontinue
    } catch {
      break
    }

    if (!plcontinue) break
  }

  return allLinks
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const count = Math.min(Math.max(parseInt(searchParams.get('count') || '10'), 1), 20)

  try {
    const clientId = getClientIp(request)
    if (!(await checkRateLimit(`portail-wikipedia:${clientId}`, 30, 60_000))) {
      return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
    }

    const totalCached = await prisma.cachedWikipediaPortalArticle.count({
      where: { expiresAt: { gte: new Date() } },
    })

    if (totalCached >= count) {
      const skip = Math.floor(Math.random() * Math.max(totalCached - count + 1, 0))
      const articles = await prisma.cachedWikipediaPortalArticle.findMany({
        where: { expiresAt: { gte: new Date() } },
        select: { id: true, title: true, extract: true, imageUrl: true, pageUrl: true },
        skip,
        take: count,
      })
      if (articles.length > 0) {
        return NextResponse.json(articles)
      }
    } else if (totalCached > 0) {
      const articles = await prisma.cachedWikipediaPortalArticle.findMany({
        where: { expiresAt: { gte: new Date() } },
        select: { id: true, title: true, extract: true, imageUrl: true, pageUrl: true },
      })
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
      const expiresAt = new Date(now.getTime() + TTL_MS)

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
