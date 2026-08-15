import { prisma } from './db'
import { ALLOWED_CRON_IPS, isAllowedIp } from './ip'

export { ALLOWED_CRON_IPS, isAllowedIp }

export async function cleanupExpired() {
  const now = new Date()
  const [cnrs, radio, wiki, wikiLoves, news, f1, portailWikipedia, citation, insolite] = await Promise.all([
    prisma.cachedCnrsArticle.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.cachedRadioEpisode.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.cachedWikipediaImage.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.cachedWikiLovesImage.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.cachedNewsArticle.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.cachedF1Article.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.cachedWikipediaPortalArticle.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.cachedCitationArticle.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.cachedInsoliteArticle.deleteMany({ where: { expiresAt: { lt: now } } }),
  ])

  return { cnrs: cnrs.count, radio: radio.count, wiki: wiki.count, wikiLoves: wikiLoves.count, news: news.count, f1: f1.count, portailWikipedia: portailWikipedia.count, citation: citation.count, insolite: insolite.count }
}

export async function getValidCachedCnrsArticles() {
  return prisma.cachedCnrsArticle.findMany({
    where: { expiresAt: { gte: new Date() } },
    orderBy: { scrapedAt: 'desc' },
  })
}

export async function getValidCachedRadioEpisodes() {
  return prisma.cachedRadioEpisode.findMany({
    where: { expiresAt: { gte: new Date() } },
    orderBy: { scrapedAt: 'desc' },
  })
}

export async function getValidCachedWikipediaImages() {
  return prisma.cachedWikipediaImage.findMany({
    where: { expiresAt: { gte: new Date() } },
    orderBy: { scrapedAt: 'desc' },
  })
}


export async function upsertWikipediaImages(images: Array<{ imageUrl: string; description: string; fileUrl: string; date: string; archive: string; language?: string }>) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  await Promise.all(images.map(image => {
    const lang = image.language || 'fr'
    return prisma.cachedWikipediaImage.upsert({
      where: { imageUrl_date_language: { imageUrl: image.imageUrl, date: image.date, language: lang } },
      update: { description: image.description, fileUrl: image.fileUrl, archive: image.archive, scrapedAt: now, expiresAt },
      create: { imageUrl: image.imageUrl, description: image.description, fileUrl: image.fileUrl, date: image.date, archive: image.archive, language: lang, scrapedAt: now, expiresAt },
    })
  }))

  return images.length
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function clearAllNewsArticles() {
  return prisma.cachedNewsArticle.deleteMany({})
}

export async function clearFreenewsapiArticles() {
  return prisma.cachedNewsArticle.deleteMany({
    where: {
      url: {
        contains: 'freenewsapi.io',
      },
    },
  })
}

export async function cleanupNewsByMaxAge(days: number) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const result = await prisma.cachedNewsArticle.deleteMany({
    where: { scrapedAt: { lt: cutoff } },
  })
  return result.count
}

export interface CachedF1ArticleUpsert {
  url: string
  section: string
  title: string
  description: string
  content?: string
  imageUrl?: string
  meta?: unknown
  scrapedAt: Date
  expiresAt: string | Date
}

export async function upsertCachedF1Article(data: CachedF1ArticleUpsert) {
  const { url, section, title, description, content, imageUrl, meta, scrapedAt, expiresAt } = data
  const payload = {
    section,
    title,
    description,
    ...(content !== undefined ? { content } : {}),
    ...(imageUrl !== undefined ? { imageUrl } : {}),
    ...(meta !== undefined ? { meta: meta as object } : {}),
    url,
    scrapedAt,
    expiresAt,
  }
  await prisma.cachedF1Article.upsert({
    where: { url },
    update: payload,
    create: payload,
  })
}
