import { prisma } from '@/lib/db'
import { PORTAL_PAGES, PORTAL_ARTICLE_TTL_MS, fetchArticleDetails, fetchLinksFromPortal } from '@/lib/portail-wikipedia-fetch'

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
  const expiresAt = new Date(now.getTime() + PORTAL_ARTICLE_TTL_MS)

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
