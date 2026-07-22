import { prisma } from '../lib/db'
import { cleanupExpired } from '../lib/cache-helpers'

const NEWS_API_KEY = process.env.NEWS_API_KEY || ''
const NEWS_API_BASE = 'https://newsapi.org/v2'

interface NewsApiResponse {
  status: string
  articles: Array<{
    title: string
    description: string | null
    url: string
    urlToImage: string | null
    source: { name: string }
    publishedAt: string
  }>
}

interface BbcArticle {
  title: string
  description: string
  url: string
  imageUrl: string
  source: string
  category: string
  publishedAt: string
}

const CATEGORIES = ['allNews', 'world', 'business', 'tech', 'entertainment', 'sports', 'science', 'health'] as const
const COUNTRIES = ['gb', 'us'] as const

async function fetchFromApi(category: string): Promise<BbcArticle[]> {
  if (!NEWS_API_KEY) {
    console.log(`  ⚠️ NEWS_API_KEY not set, skipping ${category}`)
    return []
  }

  const allArticles: BbcArticle[] = []

  for (const country of COUNTRIES) {
    try {
      const url = `${NEWS_API_BASE}/top-headlines?country=${country}&category=${category}&apiKey=${NEWS_API_KEY}`
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15000),
      })
      
      if (!res.ok) {
        console.log(`  ${country}/${category}: HTTP ${res.status}`)
        continue
      }

      const data: NewsApiResponse = await res.json()
      if (data.status !== 'ok' || !data.articles) {
        continue
      }

      for (const article of data.articles) {
        if (!article.url || !article.title) continue
        
        allArticles.push({
          title: article.title,
          description: article.description || '',
          url: article.url,
          imageUrl: article.urlToImage || '',
          source: article.source.name,
          category,
          publishedAt: article.publishedAt,
        })
      }

      console.log(`  ${country}/${category}: ${data.articles.length} articles`)
    } catch {
      console.log(`  ${country}/${category}: erreur`)
    }
  }

  return allArticles
}

export async function scrapeAndCacheBbcNews(): Promise<void> {
  console.log('📰 Scraping BBC News...')
  const allArticles: BbcArticle[] = []

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
  const expiresAt = new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString()
  
  for (const article of allArticles) {
    await prisma.cachedBbcArticle.upsert({
      where: { url: article.url },
      update: { ...article, scrapedAt: now, expiresAt },
      create: { ...article, scrapedAt: now, expiresAt },
    })
  }
  
  console.log(`  ✅ ${allArticles.length} articles upserted`)
  await cleanupExpired()
}

if (process.argv[1]?.includes('cache-bbc')) {
  scrapeAndCacheBbcNews()
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
