import { prisma } from '@/lib/db'
import { CACHE_SOURCES } from '@/lib/admin-cache-config'

const CACHE_KEY = 'apropos_stats'
const TTL_MS = 24 * 60 * 60 * 1000

export interface AproposStats {
  ideas: number
  cnrs: number
  radio: number
  news: number
  f1: number
  portailWiki: number
  wikiImages: number
  wikiLoves: number
  saviezVous: number
  proverbes: number
  citations: number
  insolite: number
}

async function computeStats(): Promise<AproposStats> {
  const countSql = `SELECT\n        ${CACHE_SOURCES.map(s =>
    `(SELECT COUNT(*) FROM ${s.model}) as "${s.statsArticles}"`
  ).join(',\n        ')}`
  const cacheStats = await prisma.$queryRawUnsafe<Record<string, bigint>[]>(countSql)

  const [ideaCount, saviezVousCount, proverbeRow] = await Promise.all([
    prisma.idea.count({ where: { isPublished: true } }),
    prisma.saviezVousFact.count(),
    prisma.cachedConfig.findUnique({ where: { key: 'proverbes_all' } }),
  ])

  const stats = cacheStats[0]
  const num = (k: string) => Number(stats[k] ?? BigInt(0))

  return {
    ideas: ideaCount,
    cnrs: num('cnrsArticles'),
    radio: num('radioEpisodes'),
    news: num('newsArticles'),
    f1: num('f1Articles'),
    portailWiki: num('portailWikipediaArticles'),
    wikiImages: num('wikiImages'),
    wikiLoves: num('wikiLovesImages'),
    saviezVous: saviezVousCount,
    proverbes: proverbeRow ? (() => { try { return JSON.parse(proverbeRow.value).length } catch { return 0 } })() : 0,
    citations: num('citationArticles'),
    insolite: num('insoliteArticles'),
  }
}

export async function getAproposStats(): Promise<AproposStats> {
  const cached = await prisma.cachedConfig.findUnique({ where: { key: CACHE_KEY } })
  if (cached) {
    try {
      const data = JSON.parse(cached.value)
      if (Date.now() - data.timestamp < TTL_MS) {
        return data.stats
      }
    } catch {
      /* stale, recompute */
    }
  }

  const stats = await computeStats()
  await prisma.cachedConfig.upsert({
    where: { key: CACHE_KEY },
    update: { value: JSON.stringify({ stats, timestamp: Date.now() }) },
    create: { key: CACHE_KEY, value: JSON.stringify({ stats, timestamp: Date.now() }) },
  })
  return stats
}
