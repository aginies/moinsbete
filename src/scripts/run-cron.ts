import { scrapeAndCacheCnrs } from './cache-cnrs'
import { scrapeAndCacheRadioEpisodes } from './cache-radio-france'
import { scrapeAndCacheWikipediaImages, scrapeAndCacheWikipediaImagesEN } from './cache-wikipedia-image'
import { scrapeAndCacheNews } from './cache-news'
import { scrapeAndCacheSaviezVousImages } from './cache-saviez-vous-images'
import { scrapeAndCacheF1 } from './cache-f1'
import { scrapeAndCacheCitation } from './cache-citation'
import { scrapeAndCachePortailLexicalWotd } from './cache-portail-lexical'
import { scrapeAndCachePortailWikipedia } from './cache-portail-wikipedia'
import { scrapeAndCacheInsolite } from './cache-insolite'
import { cleanupExpired, cleanupNewsByMaxAge } from '@/lib/cache-helpers'
import { cleanupOldInsoliteConfigs } from '@/lib/insolite'
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
    await scrapeAndCacheWikipediaImagesEN()
    await scrapeAndCacheSaviezVousImages()
    await scrapeAndCacheF1()
    await scrapeAndCacheCitation()
    await scrapeAndCachePortailWikipedia()
    await scrapeAndCachePortailLexicalWotd()
    await scrapeAndCacheInsolite()

    const counts = await cleanupExpired()
    await cleanupNewsByMaxAge(5)
    await cleanupOldInsoliteConfigs(30)

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
