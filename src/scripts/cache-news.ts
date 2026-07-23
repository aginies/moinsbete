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

interface FreeNewsArticleDetail {
  data: {
    uuid: string
    title: string
    thumbnail?: string
    original_url: string
    publisher: string
    published_at: string
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

const CATEGORY_MAP: Record<string, string> = {
  world: 'world',
  business: 'business',
  technology: 'technology',
  entertainment: 'entertainment',
  sports: 'sports',
  science: 'science',
  health: 'health',
  'digital currencies': 'digital currencies',
}

const CATEGORIES = Object.keys(CATEGORY_MAP) as Array<keyof typeof CATEGORY_MAP>

async function fetchArticleDetail(uuid: string, publisher?: string): Promise<{ imageUrl: string; url: string }> {
  try {
    const res = await fetch(`${FREE_NEWS_API_BASE}/details?uuid=${uuid}`, {
      headers: { 'x-api-key': FREE_NEWS_API_KEY },
      signal: AbortSignal.timeout(10000),
    })
    
    if (!res.ok) {
      return {
        imageUrl: '',
        url: publisher || '',
      }
    }

    const data: FreeNewsArticleDetail = await res.json()
    return {
      imageUrl: data.data?.thumbnail || '',
      url: data.data?.original_url || (publisher || ''),
    }
  } catch {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      const res = await fetch(`${FREE_NEWS_API_BASE}/details?uuid=${uuid}`, {
        headers: { 'x-api-key': FREE_NEWS_API_KEY },
        signal: AbortSignal.timeout(10000),
      })
      
      if (!res.ok) {
        return {
          imageUrl: '',
          url: publisher || '',
        }
      }

      const data: FreeNewsArticleDetail = await res.json()
      return {
        imageUrl: data.data?.thumbnail || '',
        url: data.data?.original_url || (publisher || ''),
      }
    } catch {
      return {
        imageUrl: '',
        url: publisher || '',
      }
    }
  }
}

async function fetchArticlesWithDetails(articles: Array<{ uuid: string; title: string; published_at: string; publisher: string }>, category: string): Promise<NewsArticle[]> {
  const batchSize = 10
  const results: NewsArticle[] = []

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize)
    const details = await Promise.all(
      batch.map(article => fetchArticleDetail(article.uuid, article.publisher))
    )

    for (let j = 0; j < batch.length; j++) {
      const article = batch[j]
      const detail = details[j]
      results.push({
        title: article.title,
        description: '',
        url: detail.url,
        imageUrl: detail.imageUrl,
        source: article.publisher,
        category,
        publishedAt: article.published_at,
      })
    }

    if (i + batchSize < articles.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return results
}

async function fetchFromApi(category: string): Promise<NewsArticle[]> {
  if (!FREE_NEWS_API_KEY) {
    console.log(`  ⚠️ FREE_NEWS_API_KEY not set, skipping ${category}`)
    return []
  }

  try {
    const params = new URLSearchParams({
      language: 'fr',
      country: 'fr',
      order_by: 'recent',
      page_size: '100',
      topic: CATEGORY_MAP[category],
    })

    const url = `${FREE_NEWS_API_BASE}/news?${params.toString()}`
    const res = await fetch(url, {
      headers: { 'x-api-key': FREE_NEWS_API_KEY },
      signal: AbortSignal.timeout(30000),
    })
    
    if (!res.ok) {
      console.log(`  ${category}: HTTP ${res.status}`)
      return []
    }

    const data: FreeNewsApiResponse = await res.json()
    if (!data.data || data.data.length === 0) {
      return []
    }

    const articles = await fetchArticlesWithDetails(data.data, category)

    console.log(`  ${category}: ${articles.length} articles`)
    return articles
  } catch {
    console.log(`  ${category}: erreur`)
  }

  return []
}

export async function scrapeAndCacheNews(): Promise<void> {
  console.log('📰 Scraping News...')
  const allArticles: NewsArticle[] = []

  for (const category of CATEGORIES) {
    console.log(`\n  Category: ${category}`)
    const articles = await fetchFromApi(category)
    allArticles.push(...articles)
    if (category !== CATEGORIES[CATEGORIES.length - 1]) {
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
  }

  if (allArticles.length === 0) {
    console.log('⚠️ Aucun article trouvé')
    return
  }

  console.log(`\n💾 Upsert ${allArticles.length} articles en DB...`)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  
  for (const article of allArticles) {
    await prisma.cachedNewsArticle.upsert({
      where: { url: article.url },
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
