import { prisma } from '../lib/db'
import { sleep, cleanupExpired } from '../lib/cache-helpers'

const NEWSROOM_BASE = 'https://www.cnrs.fr'

interface ScrapedArticle {
  title: string
  link: string
  imageUrl: string
  category: string
}

export async function scrapeAndCacheCnrs(): Promise<void> {
  console.log('📚 Scraping CNRS newsroom...')
  const allArticles: ScrapedArticle[] = []
  const totalPages = 100
  const BATCH_SIZE = 5
  const BATCH_DELAY = 2000 // ms between batches

  async function fetchPage(page: number): Promise<ScrapedArticle[]> {
    try {
      const res = await fetch(`${NEWSROOM_BASE}/fr/newsroom?page=${page}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) {
        console.log(`  Page ${page}/${totalPages}: HTTP ${res.status}`)
        return []
      }

      const html = await res.text()
      const articles: ScrapedArticle[] = []
      const validCategories = ['actualite', 'presse', 'lejournal', 'images', 'bibliotheque', 'videos', 'diaporamas']
      const usedLinks = new Set<string>()

      const articleBlocks = html.split('class="views-row"')
      for (const block of articleBlocks) {
        const titleMatch = block.match(/field--name-title field--type-string field--label-hidden">([\s\S]*?)<\/span>/)
        const linkMatch = block.match(/href="(\/fr\/(actualite|presse|lejournal|images|bibliotheque|videos|diaporamas)[^"]*)"/)
        const imgMatch = block.match(/src="([^"]*(?:jpg|png|jpeg)[^"]*)"/)

        if (!titleMatch || !linkMatch || !imgMatch) continue

        const title = titleMatch[1].replace(/<[^>]*>/g, '').trim()
        const href = linkMatch[1]
        const category = linkMatch[2]
        const imageUrl: string = imgMatch[1]

        if (!title || !href || !imageUrl) continue
        if (usedLinks.has(href)) continue
        if (!validCategories.includes(category)) continue

        usedLinks.add(href)

        const fullLink = href.startsWith('http') ? href : `${NEWSROOM_BASE}${href}`
        const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${NEWSROOM_BASE}${imageUrl}`

        articles.push({ title, link: fullLink, imageUrl: fullImageUrl, category })
      }

      return articles
    } catch {
      console.log(`  Page ${page}/${totalPages}: erreur`)
      return []
    }
  }

  // Fetch pages in parallel batches
  for (let start = 1; start <= totalPages; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE - 1, totalPages)
    const pageRange = Array.from({ length: end - start + 1 }, (_, i) => start + i)

    const results = await Promise.all(pageRange.map(page => fetchPage(page)))

    for (let i = 0; i < pageRange.length; i++) {
      const page = pageRange[i]
      const articles = results[i]
      if (articles.length > 0) {
        allArticles.push(...articles)
        console.log(`  Page ${page}/${totalPages}: ${articles.length} articles (total: ${allArticles.length})`)
      } else {
        console.log(`  Page ${page}/${totalPages}: 0 article`)
      }
    }

    // Delay between batches (not after the last batch)
    if (end < totalPages) {
      const delay = end % 20 === 0 ? 10000 : BATCH_DELAY
      console.log(`  Pause ${delay / 1000}s...`)
      await sleep(delay)
    }
  }

  if (allArticles.length === 0) {
    console.log('⚠️ Aucun article trouvé')
    return
  }

  console.log(`\n💾 Upsert ${allArticles.length} articles en DB...`)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  
  const upserts = allArticles.map(article => ({
    where: { link: article.link },
    update: { ...article, scrapedAt: now, expiresAt },
    create: { ...article, scrapedAt: now, expiresAt },
  }))
  await prisma.$transaction(upserts.map(u => 
    prisma.cachedCnrsArticle.upsert(u)
  ))
  
  console.log(`  ✅ ${allArticles.length} articles upserted`)
  await cleanupExpired()
}

if (process.argv[1]?.includes('cache-cnrs')) {
  scrapeAndCacheCnrs()
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
