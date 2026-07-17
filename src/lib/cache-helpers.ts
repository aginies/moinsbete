import { prisma } from './db'

export const ALLOWED_CRON_IPS = [
  '62.210.207.184',
  '127.0.0.1',
  '::1',
  '100.0.0.0/8',
  '10.0.0.0/8',
  '192.168.0.0/16',
]

export function isAllowedIp(ip: string): boolean {
  if (!ip) return false
  
  // Direct match
  if (ALLOWED_CRON_IPS.includes(ip)) return true
  
  // CIDR matching
  for (const cidr of ALLOWED_CRON_IPS) {
    if (cidr.includes('/')) {
      const [network, prefixLen] = cidr.split('/')
      const prefix = parseInt(prefixLen, 10)
      if (ipMatchesNetwork(ip, network, prefix)) return true
    }
  }
  
  return false
}

function ipMatchesNetwork(ip: string, network: string, prefixLen: number): boolean {
  const ipInt = ipToNumber(ip)
  const networkInt = ipToNumber(network)
  const mask = prefixLen === 0 ? 0 : (~0 << (32 - prefixLen)) >>> 0
  
  return (ipInt & mask) === (networkInt & mask)
}

function ipToNumber(ip: string): number {
  return ip
    .split('.')
    .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
}

export async function cleanupExpired() {
  const now = new Date()
  const [cnrs, radio, wiki] = await Promise.all([
    prisma.cachedCnrsArticle.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.cachedRadioEpisode.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.cachedWikipediaImage.deleteMany({ where: { expiresAt: { lt: now } } }),
  ])
  
  return { cnrs: cnrs.count, radio: radio.count, wiki: wiki.count }
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

export async function upsertCnrsArticles(articles: Array<{ title: string; link: string; imageUrl: string; category: string }>) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  
  for (const article of articles) {
    await prisma.cachedCnrsArticle.upsert({
      where: { link: article.link },
      update: { ...article, scrapedAt: now, expiresAt },
      create: { ...article, scrapedAt: now, expiresAt },
    })
  }
  
  return articles.length
}

export async function upsertRadioEpisodes(episodes: Array<{ title: string; description?: string | null; link: string; imageUrl?: string | null; audioUrl?: string | null; radio: string }>) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  for (const episode of episodes) {
    await prisma.cachedRadioEpisode.upsert({
      where: { link: episode.link },
      update: { ...episode, scrapedAt: now, expiresAt },
      create: { ...episode, scrapedAt: now, expiresAt },
    })
  }
  
  return episodes.length
}

export async function upsertWikipediaImages(images: Array<{ imageUrl: string; description: string; fileUrl: string; date: string; archive: string }>) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  
  for (const image of images) {
    await prisma.cachedWikipediaImage.upsert({
      where: { imageUrl_date: { imageUrl: image.imageUrl, date: image.date } },
      update: { ...image, scrapedAt: now, expiresAt },
      create: { ...image, scrapedAt: now, expiresAt },
    })
  }
  
  return images.length
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
