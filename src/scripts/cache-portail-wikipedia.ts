import { prisma } from '@/lib/db'

const PORTAL_PAGES = [
  'Wikipédia:Contenus_de_qualité',
  'Wikipédia:Bons_contenus',
]

const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface ArticleData {
  id: string
  title: string
  extract: string
  imageUrl: string | null
  pageUrl: string
}

async function fetchLinksFromPortal(pageTitle: string): Promise<string[]> {
  let allLinks: string[] = []
  let plcontinue: string | null = null

  while (true) {
    const url: string = `https://fr.wikipedia.org/w/api.php?action=query&prop=links&titles=${encodeURIComponent(pageTitle)}&pllimit=500&format=json${plcontinue ? `&plcontinue=${encodeURIComponent(plcontinue)}` : ''}`
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

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < titles.length) {
      await new Promise(r => setTimeout(r, 200))
    }
  }

  return allResults
}

export async function scrapeAndCachePortailWikipedia(): Promise<number> {
  let allLinks: string[] = []

  for (const page of PORTAL_PAGES) {
    console.log(`[cache-portail-wikipedia] Fetching links from ${page}...`)
    const links = await fetchLinksFromPortal(page)
    console.log(`[cache-portail-wikipedia] Found ${links.length} links from ${page}`)
    allLinks = allLinks.concat(links)
  }

  allLinks = [...new Set(allLinks)]
  console.log(`[cache-portail-wikipedia] Total unique links: ${allLinks.length}`)

  console.log(`[cache-portail-wikipedia] Fetching article details for ${allLinks.length} articles...`)
  const articles = await fetchArticleDetails(allLinks)
  console.log(`[cache-portail-wikipedia] Fetched details for ${articles.length} articles`)

  const now = new Date()
  const expiresAt = new Date(now.getTime() + TTL_MS)

  const BATCH_SIZE = 50
  let upserted = 0
  const totalBatches = Math.ceil(articles.length / BATCH_SIZE)

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const progress = Math.round((batchNum / totalBatches) * 100)

    console.log(`[cache-portail-wikipedia] Upserting batch ${batchNum}/${totalBatches} (${batch.length} articles) [${progress}%]`)

    try {
      await prisma.$transaction(
        batch.map(article =>
          prisma.cachedWikipediaPortalArticle.upsert({
            where: { id: article.id },
            update: { title: article.title, extract: article.extract, imageUrl: article.imageUrl, pageUrl: article.pageUrl, scrapedAt: now, expiresAt },
            create: { id: article.id, title: article.title, extract: article.extract, imageUrl: article.imageUrl, pageUrl: article.pageUrl, scrapedAt: now, expiresAt },
          })
        )
      )
      upserted += batch.length
    } catch (err) {
      console.error(`[cache-portail-wikipedia] Batch ${batchNum} failed, retrying...`, err)
      await new Promise(r => setTimeout(r, 2000))
      await prisma.$transaction(
        batch.map(article =>
          prisma.cachedWikipediaPortalArticle.upsert({
            where: { id: article.id },
            update: { title: article.title, extract: article.extract, imageUrl: article.imageUrl, pageUrl: article.pageUrl, scrapedAt: now, expiresAt },
            create: { id: article.id, title: article.title, extract: article.extract, imageUrl: article.imageUrl, pageUrl: article.pageUrl, scrapedAt: now, expiresAt },
          })
        )
      )
      upserted += batch.length
    }
  }

  console.log(`[cache-portail-wikipedia] Upserted ${upserted} articles total`)
  return upserted
}

// CLI entry point
if (process.argv[1]?.includes('cache-portail-wikipedia')) {
  scrapeAndCachePortailWikipedia()
    .then(() => {
      console.log('[cache-portail-wikipedia] Done')
      process.exit(0)
    })
    .catch((err) => {
      console.error('[cache-portail-wikipedia] Error:', err)
      process.exit(1)
    })
    .finally(() => prisma.$disconnect())
}
