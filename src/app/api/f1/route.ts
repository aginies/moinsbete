import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/ip'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { f1Manager } from '@/lib/f1-bookmark'
import type { F1Actualite, F1Image, F1Standing, F1StandingRow, F1SaviezVous } from '@/lib/f1-wiki-parser'

interface F1Section {
  section: string
  data: unknown
}

async function fetchFromApi(): Promise<{ sections: F1Section[]; lastUpdated?: string; nextUpdate?: string }> {
  const now = new Date()

  const [actualites, image, classement, saviez, fia] = await Promise.all([
    prisma.cachedF1Article.findMany({
      where: { section: 'actualites', expiresAt: { gte: now } },
      orderBy: { scrapedAt: 'desc' },
      take: 5,
    }),
    prisma.cachedF1Article.findFirst({
      where: { section: 'image', expiresAt: { gte: now } },
      orderBy: { scrapedAt: 'desc' },
    }),
    prisma.cachedF1Article.findMany({
      where: { section: 'classement', expiresAt: { gte: now } },
      orderBy: { scrapedAt: 'desc' },
      take: 2,
    }),
    prisma.cachedF1Article.findMany({
      where: { section: 'saviez', expiresAt: { gte: now } },
      orderBy: { scrapedAt: 'desc' },
    }),
    prisma.cachedF1Article.findMany({
      where: { section: 'fia', expiresAt: { gte: now } },
      orderBy: { scrapedAt: 'desc' },
      take: 10,
    }),
  ])

  const sections: F1Section[] = []

  if (actualites.length > 0) {
    sections.push({
      section: 'actualites',
      data: actualites.map(a => ({ title: a.title, date: a.description || '', content: a.content || '', url: a.url })),
    })
  }

  if (image) {
    sections.push({ section: 'image', data: { imageUrl: image.imageUrl || '', caption: image.description || '', articleLink: image.url } })
  }

  if (classement.length > 0) {
    const standings: F1Standing[] = []
    const pilotes = classement.find(a => a.title?.includes('Pilotes'))
    const constructeurs = classement.find(a => a.title?.includes('Constructeurs'))
    if (pilotes?.meta) standings.push({ type: 'pilotes', rows: (pilotes.meta as unknown as F1StandingRow[]) })
    if (constructeurs?.meta) standings.push({ type: 'constructeurs', rows: (constructeurs.meta as unknown as F1StandingRow[]) })
    if (standings.length > 0) sections.push({ section: 'classement', data: standings })
  }

  if (saviez.length > 0) {
    sections.push({ section: 'saviez', data: { facts: saviez.map(a => a.title) } })
  }

  if (fia.length > 0) {
    sections.push({
      section: 'fia',
      data: fia.map(a => ({ title: a.title, date: a.description || '', content: a.content || '', url: a.url, imageUrl: a.imageUrl })),
    })
  }

  // Find the most recent scrapedAt and earliest expiresAt across all sections
  let lastUpdated: Date | undefined
  let nextUpdate: Date | undefined
  const allResults = [actualites, image ? [image] : [], classement, saviez, fia]
  for (const items of allResults) {
    for (const item of items) {
      if (item.scrapedAt && (!lastUpdated || item.scrapedAt > lastUpdated)) {
        lastUpdated = item.scrapedAt
      }
      if (item.expiresAt && (!nextUpdate || item.expiresAt < nextUpdate)) {
        nextUpdate = item.expiresAt
      }
    }
  }

  return { sections, lastUpdated: lastUpdated?.toISOString(), nextUpdate: nextUpdate?.toISOString() }
}

export async function GET(request: NextRequest) {
  try {
    const clientId = getClientIp(request)
    if (!(await checkRateLimit(`f1:${clientId}`, 30, 60_000))) {
      return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
    }

    const result = await fetchFromApi()
    const { sections, lastUpdated, nextUpdate } = result

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    let bookmarkedIds: string[] = []

    if (userId) {
      try {
        const favorites = await f1Manager.getFavorites(userId)
        bookmarkedIds = favorites.map(f => f.id)
      } catch (err) {
        console.error('Error fetching F1 favorites for user:', err)
      }
    }

    return NextResponse.json({ sections, bookmarkedIds, lastUpdated, nextUpdate })
  } catch (error) {
    console.error('F1 API error:', error)
    return NextResponse.json({ sections: [], bookmarkedIds: [], lastUpdated: undefined, nextUpdate: undefined })
  }
}
