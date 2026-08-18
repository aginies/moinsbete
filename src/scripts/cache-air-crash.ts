import { prisma } from '@/lib/db'
import { PORTAL_ARTICLE_TTL_MS, fetchArticleDetails, fetchLinksFromPortal } from '@/lib/portail-wikipedia-fetch'

const AIR_CRASH_PAGE = 'Air_Crash'
const AIR_CRASH_TTL_MS = PORTAL_ARTICLE_TTL_MS // 7 days

export function filterAirCrashTitles(links: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const title of links) {
    if (title.includes('(')) continue
    if (/^Vol /i.test(title) || /du vol /i.test(title) || /^Collision aérienne d'/i.test(title)) {
      if (!seen.has(title)) {
        seen.add(title)
        result.push(title)
      }
    }
  }
  return result
}

export async function scrapeAndCacheAirCrash(): Promise<number> {
  console.log(`[cache-air-crash] Fetching links from ${AIR_CRASH_PAGE}...`)
  const links = await fetchLinksFromPortal(AIR_CRASH_PAGE)
  const titles = filterAirCrashTitles(links)
  console.log(`[cache-air-crash] ${links.length} links, ${titles.length} air crash articles`)

  console.log(`[cache-air-crash] Fetching article details for ${titles.length} articles...`)
  const articles = await fetchArticleDetails(titles)
  console.log(`[cache-air-crash] Fetched details for ${articles.length} articles`)

  const now = new Date()
  const expiresAt = new Date(now.getTime() + AIR_CRASH_TTL_MS)

  const BATCH_SIZE = 50
  let upserted = 0
  const totalBatches = Math.ceil(articles.length / BATCH_SIZE)

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const progress = Math.round((batchNum / totalBatches) * 100)

    console.log(`[cache-air-crash] Upserting batch ${batchNum}/${totalBatches} (${batch.length} articles) [${progress}%]`)

    try {
      await prisma.$transaction(
        batch.map(article =>
          prisma.cachedAirCrashArticle.upsert({
            where: { title: article.title },
            update: { description: article.extract, url: article.pageUrl, imageUrl: article.imageUrl, scrapedAt: now, expiresAt },
            create: { title: article.title, description: article.extract, url: article.pageUrl, imageUrl: article.imageUrl, scrapedAt: now, expiresAt },
          })
        )
      )
      upserted += batch.length
    } catch (err) {
      console.error(`[cache-air-crash] Batch ${batchNum} failed, retrying...`, err)
      await new Promise(r => setTimeout(r, 2000))
      await prisma.$transaction(
        batch.map(article =>
          prisma.cachedAirCrashArticle.upsert({
            where: { title: article.title },
            update: { description: article.extract, url: article.pageUrl, imageUrl: article.imageUrl, scrapedAt: now, expiresAt },
            create: { title: article.title, description: article.extract, url: article.pageUrl, imageUrl: article.imageUrl, scrapedAt: now, expiresAt },
          })
        )
      )
      upserted += batch.length
    }
  }

  console.log(`[cache-air-crash] Upserted ${upserted} articles total`)
  return upserted
}

// CLI entry point
if (process.argv[1]?.includes('cache-air-crash')) {
  scrapeAndCacheAirCrash()
    .then(() => {
      console.log('[cache-air-crash] Done')
      process.exit(0)
    })
    .catch((err) => {
      console.error('[cache-air-crash] Error:', err)
      process.exit(1)
    })
    .finally(() => prisma.$disconnect())
}
