import { prisma } from '../lib/db'
import { cleanupExpired } from '../lib/cache-helpers'

const FREE_NEWS_API_KEY = process.env.FREE_NEWS_API_KEY || ''
const FREE_NEWS_API_BASE = 'https://api.freenewsapi.io/v1'
const MAX_DAILY_REQUESTS = 5000
const DAILY_REQUEST_WINDOW = 24 * 60 * 60 * 1000

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
  golf: 'golf',
  vehicles: 'vehicles',
  internetSecurity: 'internet security',
  movies: 'movies',
  gadgets: 'gadgets',
  soccer: 'soccer',
}

const CATEGORIES = Object.keys(CATEGORY_MAP) as Array<keyof typeof CATEGORY_MAP>

// --- Rate limiter queue ---
class RateLimitQueue {
  private maxConcurrency: number
  private intervalMs: number
  private running = 0
  private queue: Array<() => void> = []

  constructor(maxConcurrency: number, intervalMs: number) {
    this.maxConcurrency = maxConcurrency
    this.intervalMs = intervalMs
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    if (this.running >= this.maxConcurrency) {
      await new Promise<void>(resolve => {
        this.queue.push(() => resolve())
      })
    }
    this.running++
    try {
      return await fn()
    } finally {
      this.running--
      const next = this.queue.shift()
      if (next) {
        setTimeout(next, this.intervalMs)
      }
    }
  }
}

// --- Daily request tracker ---
interface RequestTracker {
  count: number
  windowStart: number
}

let dailyRequests: RequestTracker = { count: 0, windowStart: Date.now() }

function resetIfNeeded(): void {
  if (Date.now() - dailyRequests.windowStart > DAILY_REQUEST_WINDOW) {
    dailyRequests = { count: 0, windowStart: Date.now() }
  }
}

function consume(count: number): number {
  resetIfNeeded()
  dailyRequests.count += count
  return dailyRequests.count
}

function remaining(): number {
  resetIfNeeded()
  return MAX_DAILY_REQUESTS - dailyRequests.count
}

// --- Fetch with retry for 429 ---
async function fetchArticleDetail(uuid: string, publisher?: string): Promise<{ imageUrl: string; url: string; success: boolean; attempts: number }> {
  let lastStatus = 0
  const maxRetries = 3
  let attempts = 0

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    attempts = attempt + 1
    const reqCount = consume(1)
    const reqRemaining = remaining()

    if (reqRemaining <= 0) {
      console.log(`    ⚠️ Daily quota exhausted (${reqCount}/${MAX_DAILY_REQUESTS})`)
      return { imageUrl: '', url: publisher || '', success: false, attempts }
    }

    if (reqRemaining < 500 && reqRemaining > 0) {
      console.log(`    ⚠️ Quota low: ${reqRemaining} remaining`)
    }

    try {
      const res = await fetch(`${FREE_NEWS_API_BASE}/details?uuid=${uuid}`, {
        headers: { 'x-api-key': FREE_NEWS_API_KEY },
        signal: AbortSignal.timeout(10000),
      })

      lastStatus = res.status

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('retry-after') || '2', 10)
        const waitTime = Math.min(retryAfter * 1000, 10000)
        console.log(`    ⏳ 429 rate limited (attempt ${attempts}/${maxRetries + 1}), waiting ${waitTime}ms...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        continue
      }

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        console.log(`    ❌ HTTP ${res.status} (attempt ${attempts}/${maxRetries + 1}): ${body.slice(0, 100)}`)
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1500
          console.log(`    🔄 Retrying in ${waitTime}ms...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }
        return { imageUrl: '', url: publisher || '', success: false, attempts }
      }

      const data: FreeNewsArticleDetail = await res.json()
      const url = data.data?.original_url || (publisher || '')
      const imageUrl = data.data?.thumbnail || ''

      if (!url.startsWith('http')) {
        console.log(`    ⚠️ No original_url in response (publisher: ${publisher})`)
        return { imageUrl, url, success: false, attempts }
      }

      return { imageUrl, url, success: true, attempts }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.log(`    ❌ Fetch error (attempt ${attempts}/${maxRetries + 1}): ${errMsg}`)
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1500
        console.log(`    🔄 Retrying in ${waitTime}ms...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        continue
      }
      return { imageUrl: '', url: publisher || '', success: false, attempts }
    }
  }

  return { imageUrl: '', url: publisher || '', success: false, attempts }
}

// --- Fetch articles with details using rate-limited queue ---
async function fetchArticlesWithDetails(articles: Array<{ uuid: string; title: string; published_at: string; publisher: string }>, category: string): Promise<NewsArticle[]> {
  const batchSize = 10
  const results: NewsArticle[] = []
  const queue = new RateLimitQueue(2, 600)
  const stats = { success: 0, failed: 0, rateLimited: 0, noUrl: 0 }

  console.log(`  Processing ${articles.length} articles...`)

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(articles.length / batchSize)
    console.log(`  [${batchNum}/${totalBatches}] Fetching details for ${batch.length} articles...`)

    const detailPromises = batch.map(async (article, j) => {
      const globalIdx = i + j + 1
      console.log(`    [${globalIdx}/${articles.length}] ${article.title.slice(0, 50)}...`)

      const detail = await queue.add(async () => {
        return fetchArticleDetail(article.uuid, article.publisher)
      })

      results.push({
        title: article.title,
        description: '',
        url: detail.url,
        imageUrl: detail.imageUrl,
        source: article.publisher,
        category,
        publishedAt: article.published_at,
      })

      if (detail.success) {
        stats.success++
      } else if (detail.url === (article.publisher || '')) {
        stats.failed++
      }
    })

    await Promise.all(detailPromises)

    if (i + batchSize < articles.length) {
      console.log(`  Pause 2s before next batch...`)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  console.log(`  📊 Stats: ${stats.success} success, ${stats.failed} failed (publisher fallback)`)
  console.log(`  📊 Total API calls: ${consume(0) - (dailyRequests.count - consume(articles.length))} (tracked internally)`)

  return results
}

async function fetchFromApi(category: string): Promise<NewsArticle[]> {
  if (!FREE_NEWS_API_KEY) {
    console.log(`  ⚠️ FREE_NEWS_API_KEY not set, skipping ${category}`)
    return []
  }

  const reqRemaining = remaining()
  if (reqRemaining <= 0) {
    console.log(`  🛑 Daily quota exhausted (${MAX_DAILY_REQUESTS}/${MAX_DAILY_REQUESTS}), skipping ${category}`)
    return []
  }
  if (reqRemaining < 100) {
    console.log(`  ⚠️ Low quota (${reqRemaining} remaining), skipping ${category}`)
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
    let res
    let retries = 0
    const maxRetries = 1

    do {
      const timeout = retries === 0 ? 45000 : 30000
      console.log(`  📡 Fetching ${category} (request #${consume(1)}/${MAX_DAILY_REQUESTS}, ${remaining()} remaining)`)

      res = await fetch(url, {
        headers: { 'x-api-key': FREE_NEWS_API_KEY },
        signal: AbortSignal.timeout(timeout),
      })

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        console.log(`  ${category}: HTTP ${res.status} - ${body.slice(0, 100)}`)
        if (retries < maxRetries) {
          retries++
          console.log(`  🔄 Retry ${retries}/${maxRetries} for ${category}...`)
          await new Promise(resolve => setTimeout(resolve, 2000))
          continue
        }
        return []
      }

      break
    } while (true)

    const data: FreeNewsApiResponse = await res.json()
    if (!data.data || data.data.length === 0) {
      console.log(`  ${category}: 0 articles returned`)
      return []
    }

    console.log(`  ${category}: ${data.data.length} articles from API, fetching details...`)
    const articles = await fetchArticlesWithDetails(data.data, category)

    const validUrlCount = articles.filter(a => a.url.startsWith('http')).length
    console.log(`  ${category}: ${validUrlCount}/${articles.length} articles have valid URLs`)

    return articles
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.log(`  ${category}: erreur - ${errMsg}`)
  }

  return []
}

export async function scrapeAndCacheNews(): Promise<void> {
  resetIfNeeded()
  const startTime = Date.now()
  console.log('📰 Scraping News...')
  console.log(`   Quota: ${remaining()}/${MAX_DAILY_REQUESTS} remaining`)
  console.log(`   Started at: ${new Date().toISOString()}`)
  console.log('')

  const allArticles: NewsArticle[] = []

  const categoryArg = process.argv.find(arg => arg.startsWith('--category='))
  const selectedCategory = categoryArg ? categoryArg.split('=')[1] : null
  const categoriesToFetch = selectedCategory
    ? CATEGORIES.filter(c => c === selectedCategory)
    : CATEGORIES

  if (selectedCategory && categoriesToFetch.length === 0) {
    console.log(`  ⚠️ Category "${selectedCategory}" not found. Available: ${CATEGORIES.join(', ')}`)
    return
  }

  console.log(`   Categories: ${selectedCategory || 'all (' + categoriesToFetch.length + ')'}`)
  console.log('')

  for (let catIdx = 0; catIdx < categoriesToFetch.length; catIdx++) {
    const category = categoriesToFetch[catIdx]
    const globalIdx = selectedCategory
      ? 1
      : CATEGORIES.indexOf(category) + 1
    console.log(`\n═══ Category ${globalIdx}/${CATEGORIES.length}: ${category} ═══`)

    const articles = await fetchFromApi(category)
    allArticles.push(...articles)

    if (catIdx < CATEGORIES.length - 1) {
      console.log(`  Pause 3s before next category...`)
      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
    console.log(`  ⏱️ Elapsed: ${elapsed}s`)
  }

  if (allArticles.length === 0) {
    console.log('\n⚠️ Aucun article trouvé')
    return
  }

  const validUrls = allArticles.filter(a => a.url.startsWith('http')).length
  const totalCalls = dailyRequests.count
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)

  console.log(`\n═══ Summary ═══`)
  console.log(`  Total articles: ${allArticles.length}`)
  console.log(`  Valid URLs: ${validUrls}/${allArticles.length} (${Math.round(validUrls / allArticles.length * 100)}%)`)
  console.log(`  API calls made: ${totalCalls}/${MAX_DAILY_REQUESTS}`)
  console.log(`  Time elapsed: ${elapsed}s`)
  console.log(`  Remaining quota: ${remaining()}`)

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
      console.log('\nDone!')
      process.exit(0)
    })
    .catch(e => {
      console.error('Erreur:', e)
      process.exit(1)
    })
    .finally(() => prisma.$disconnect())
}
