import { scrapeAndCacheCnrs } from './cache-cnrs'
import { scrapeAndCacheRadioEpisodes } from './cache-radio-france'
import { scrapeAndCacheWikipediaImages } from './cache-wikipedia-image'
import { scrapeAndCacheNews } from './cache-news'
import { scrapeAndCacheSaviezVousImages } from './cache-saviez-vous-images'
import { prisma } from '@/lib/db'

async function run() {
  console.log(`\n═══════════════════════════════════════`)
  console.log(`[cron] Starting cache update at ${new Date().toISOString()} (Europe/Paris)`)
  console.log(`═══════════════════════════════════════\n`)

  try {
    await scrapeAndCacheCnrs()
    await scrapeAndCacheRadioEpisodes()
    await scrapeAndCacheNews()
    await scrapeAndCacheWikipediaImages(1)
    await scrapeAndCacheSaviezVousImages()

    console.log(`\n═══════════════════════════════════════`)
    console.log(`[cron] Cache update completed successfully`)
    console.log(`═══════════════════════════════════════\n`)
    await prisma.$disconnect()
    process.exit(0)
  } catch (error) {
    console.error(`\n═══════════════════════════════════════`)
    console.error(`[cron] Cache update FAILED: ${error}`)
    console.error(`═══════════════════════════════════════\n`)
    await prisma.$disconnect()
    process.exit(1)
  }
}

run()
