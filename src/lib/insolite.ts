import { prisma } from '@/lib/db'

export interface InsoliteArticle {
  id: string
  title: string
  description: string
  url: string
  imageUrl: string | null
}

export async function getRandomInsoliteArticles(count: number = 20): Promise<InsoliteArticle[]> {
  const validArticles = await prisma.cachedInsoliteArticle.findMany({
    where: {
      expiresAt: { gte: new Date() },
    },
    take: count,
    orderBy: { scrapedAt: 'desc' },
  })

  if (validArticles.length === 0) return []

  const result: InsoliteArticle[] = []
  const shuffled = [...validArticles].sort(() => Math.random() - 0.5)
  const takeCount = Math.min(count, shuffled.length)

  for (let i = 0; i < takeCount; i++) {
    const article = shuffled[i]
    result.push({
      id: article.id,
      title: article.title,
      description: article.description || '',
      url: article.url,
      imageUrl: article.imageUrl,
    })
  }

  return result
}

export async function getInsoliteArticleById(id: string): Promise<InsoliteArticle | null> {
  const article = await prisma.cachedInsoliteArticle.findFirst({
    where: {
      id,
      expiresAt: { gte: new Date() },
    },
  })

  if (!article) return null

  return {
    id: article.id,
    title: article.title,
    description: article.description || '',
    url: article.url,
    imageUrl: article.imageUrl,
  }
}

const INSOLITE_PREFIX = 'insolite_'

export async function getValidInsoliteArticleCount(): Promise<number> {
  return prisma.cachedInsoliteArticle.count({
    where: {
      expiresAt: { gte: new Date() },
    },
  })
}

export async function pickAndSaveTodayInsoliteArticle(date: string): Promise<InsoliteArticle | null> {
  const config = await prisma.cachedConfig.findUnique({
    where: { key: `${INSOLITE_PREFIX}${date}` },
  })

  let shownCount = 0
  if (config?.value) {
    try {
      const parsed = JSON.parse(config.value)
      shownCount = parsed.shownCount || 0
      // Return the same article if already picked today
      if (parsed.selectedId) {
        const article = await prisma.cachedInsoliteArticle.findUnique({
          where: { id: parsed.selectedId },
        })
        if (article && article.expiresAt >= new Date()) {
          return {
            id: article.id,
            title: article.title,
            description: article.description || '',
            url: article.url,
            imageUrl: article.imageUrl,
          }
        }
      }
    } catch {
      shownCount = 0
    }
  }

  const totalValid = await getValidInsoliteArticleCount()

  if (shownCount >= totalValid && totalValid > 0) {
    await prisma.cachedConfig.delete({ where: { key: `${INSOLITE_PREFIX}${date}` } })
    shownCount = 0
  }

  const validArticles = await prisma.cachedInsoliteArticle.findMany({
    where: {
      expiresAt: { gte: new Date() },
    },
  })

  if (validArticles.length === 0) return null

  const shownIds = new Set<string>()
  if (config?.value) {
    try {
      const parsed = JSON.parse(config.value)
      const ids = parsed.shownIds || []
      for (const id of ids) {
        shownIds.add(id)
      }
    } catch {
      // ignore
    }
  }

  const unseen = validArticles.filter(a => !shownIds.has(a.id))
  const pool = unseen.length > 0 ? unseen : validArticles
  const articlesWithImage = pool.filter(a => a.imageUrl)
  const articlePool = articlesWithImage.length > 0 ? articlesWithImage : pool
  const article = articlePool[Math.floor(Math.random() * articlePool.length)]

  if (!article) return null

  const newShownIds = [...shownIds, article.id]
  const newValue = JSON.stringify({
    shownCount: shownIds.size + (unseen.length > 0 ? 1 : 0),
    shownIds: newShownIds.slice(-100),
    selectedId: article.id,
  })

  await prisma.cachedConfig.upsert({
    where: { key: `${INSOLITE_PREFIX}${date}` },
    update: { value: newValue },
    create: { key: `${INSOLITE_PREFIX}${date}`, value: newValue },
  })

  return {
    id: article.id,
    title: article.title,
    description: article.description || '',
    url: article.url,
    imageUrl: article.imageUrl,
  }
}

export async function cleanupOldInsoliteConfigs(days: number = 30): Promise<number> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const allConfigs = await prisma.cachedConfig.findMany({
    where: { key: { startsWith: INSOLITE_PREFIX } },
  })

  let deleted = 0
  for (const config of allConfigs) {
    const dateStr = config.key.slice(INSOLITE_PREFIX.length)
    try {
      const configDate = new Date(dateStr)
      if (configDate < cutoff) {
        await prisma.cachedConfig.delete({ where: { key: config.key } })
        deleted++
      }
    } catch {
      // invalid date format, skip
    }
  }

  return deleted
}
