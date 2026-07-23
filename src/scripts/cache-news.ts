import { prisma } from '../lib/db'
import { cleanupExpired } from '../lib/cache-helpers'

const FREE_NEWS_API_KEY = process.env.FREE_NEWS_API_KEY || ''
const FREE_NEWS_API_BASE = 'https://api.freenewsapi.io/v1'

interface FreeNewsApiResponse {
  data: Array<{
    uuid: string
    title: string
    published_at: string
    publisher: string
  }>
  meta: {
    has_more: boolean
    next_cursor?: string
  }
}

interface NewsArticle {
  title: string
  description: string
  url: string
  imageUrl: string
  source: string
  category: string
  publishedAt: string
}

const CATEGORY_MAP: Record<string, { topic?: string; query: string }> = {
  allNews: { query: 'allNews' },
  world: { topic: 'world', query: 'world' },
  business: { topic: 'business', query: 'business' },
  technology: { topic: 'technology', query: 'technology' },
  entertainment: { topic: 'entertainment', query: 'entertainment' },
  sports: { topic: 'sports', query: 'sports' },
  science: { topic: 'science', query: 'science' },
  health: { topic: 'health', query: 'health' },
  'digital currencies': { topic: 'digital currencies', query: 'digital currencies' },
  cinema: { query: 'cinema' },
  auto: { query: 'auto' },
}

const CATEGORIES = Object.keys(CATEGORY_MAP) as Array<keyof typeof CATEGORY_MAP>

async function fetchFromApi(category: string): Promise<NewsArticle[]> {
  if (!FREE_NEWS_API_KEY) {
    console.log(`  ⚠️ FREE_NEWS_API_KEY not set, skipping ${category}`)
    return []
  }

  const allArticles: NewsArticle[] = []
  const config = CATEGORY_MAP[category as keyof typeof CATEGORY_MAP]
  let offset = 0
  let hasMore = true

  try {
    const params = new URLSearchParams({
      language: 'fr',
      country: 'fr',
      order_by: 'published_at',
      page_size: '100',
      q: config.query,
    })

    if (config.topic) {
      params.set('topic', config.topic)
    }

    if (offset > 0) {
      params.set('offset', String(offset))
    }

    const url = `${FREE_NEWS_API_BASE}/news?${params.toString()}`
    const res = await fetch(url, {
      headers: { 'x-api-key': FREE_NEWS_API_KEY },
      signal: AbortSignal.timeout(15000),
    })
    
    if (!res.ok) {
      console.log(`  ${category}: HTTP ${res.status}`)
      return []
    }

    const data: FreeNewsApiResponse = await res.json()
    if (!data.data || data.data.length === 0) {
      return []
    }

    for (const article of data.data) {
      allArticles.push({
        title: article.title,
        description: '',
        url: `https://www.freenewsapi.io/v1/details?uuid=${article.uuid}`,
        imageUrl: '',
        source: article.publisher,
        category,
        publishedAt: article.published_at,
      })
    }

    console.log(`  ${category}: ${data.data.length} articles`)

    if (data.meta.has_more && data.meta.next_cursor) {
      offset += data.data.length
      hasMore = true
    }
  } catch {
    console.log(`  ${category}: erreur`)
  }

  return allArticles
}

export async function scrapeAndCacheNews(): Promise<void> {
  console.log('📰 Scraping News...')
  const allArticles: NewsArticle[] = []

  for (const category of CATEGORIES) {
    console.log(`\n  Category: ${category}`)
    const articles = await fetchFromApi(category)
    allArticles.push(...articles)
  }

  if (allArticles.length === 0) {
    console.log('⚠️ Aucun article trouvé')
    return
  }

  console.log(`\n💾 Upsert ${allArticles.length} articles en DB...`)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  
  for (const article of allArticles) {
    const uuid = article.url.split('uuid=')[1] || article.url
    await prisma.cachedNewsArticle.upsert({
      where: { url: uuid },
      update: { ...article, scrapedAt: now, expiresAt },
      create: { ...article, scrapedAt: now, expiresAt },
    })
  }
  
  console.log(`  ✅ ${allArticles.length} articles upserted`)
  await cleanupExpired()
}

if (process.argv[1]?.includes('cache-news')) {
  scrapeAndCacheNews()
    .then(() => {
      console.log('Done!')
      process.exit(0)
    })
    .catch(e => {
      console.error('Erreur:', e)
      process.exit(1)
    })
    .finally(() => prisma.$disconnect())
}
