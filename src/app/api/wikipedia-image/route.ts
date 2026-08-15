import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/ip'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'
import { getCachedPool } from '@/lib/feed-pool-cache'
import { extractEntriesFR, type WikipediaImageEntry } from '@/lib/wikipedia-image-parse'
import type { CachedWikipediaImage } from '@/generated/client'

const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

const archives = MONTHS.flatMap((m) =>
  Array.from({ length: 2026 - 2005 + 1 }, (_, i) => `${m} ${2005 + i}`)
)

async function fetchWithRetry(url: string, maxRetries = 3): Promise<unknown> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'moinsbete (https://moinsbete.guibo.com; bot-traffic@wikimedia.org)' },
        signal: AbortSignal.timeout(15000),
      })
      const text = await res.text()
      try {
        return JSON.parse(text)
      } catch {
        if (i < maxRetries - 1) {
          await new Promise((r) => setTimeout(r, 1000))
          continue
        }
        return null
      }
    } catch {
      if (i < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 1000))
        continue
      }
      return null
    }
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    const clientId = getClientIp(request)
    if (!(await checkRateLimit(`wiki-image:${clientId}`, 30, 60_000))) {
      return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
    }

    const session = await getSession()
    const langParam = request.nextUrl.searchParams.get('lang')
    let languages: string[]
    if (langParam) {
      languages = langParam.split(',').filter(Boolean)
    } else if (session?.user) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { wikipediaImageShowEn: true } })
      languages = user?.wikipediaImageShowEn ? ['fr', 'en'] : ['fr']
    } else {
      languages = ['fr']
    }

    // Try cache first
    const now = new Date()
    const pool = await getCachedPool<CachedWikipediaImage[]>(`wiki-image:${languages.join(',')}`, () =>
      prisma.cachedWikipediaImage.findMany({
        where: {
          expiresAt: { gte: new Date() },
          language: { in: languages },
        },
      })
    )
    const valid = pool.filter(i => i.expiresAt >= now)
    const randomEntry = valid.length > 0 ? valid[Math.floor(Math.random() * valid.length)] : null

    if (randomEntry) {
      return NextResponse.json({
        imageUrl: randomEntry.imageUrl,
        description: randomEntry.description,
        fileUrl: randomEntry.fileUrl,
        date: randomEntry.date,
      })
    }

    // Cache empty — scrape fresh (fallback, FR only)
    const usedArchives = new Set<string>()
    const maxRetries = 5
    let entries: WikipediaImageEntry[] = []
    let randomArchive: string

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      do {
        randomArchive = archives[Math.floor(Math.random() * archives.length)]
      } while (usedArchives.has(randomArchive) && usedArchives.size < archives.length)
      
      usedArchives.add(randomArchive)

      const data = await fetchWithRetry(
        `https://fr.wikipedia.org/w/api.php?action=parse&page=Wikip%C3%A9dia:Image_du_jour/${encodeURIComponent(randomArchive)}&prop=text&format=json`
      ) as { parse?: { text?: { '*': string } } }

      if (!data?.parse?.text?.['*']) continue

      entries = extractEntriesFR(data.parse.text['*'], randomArchive)
      if (entries.length > 0) break
    }

    if (entries.length > 0) {
      const randomEntry = entries[Math.floor(Math.random() * entries.length)]
      return NextResponse.json({
        imageUrl: randomEntry.imageUrl,
        description: randomEntry.description,
        fileUrl: randomEntry.fileUrl,
        date: randomEntry.date,
      })
    }

    // All failed — return placeholder
    return NextResponse.json({
      imageUrl: '',
      description: 'Image du jour — Wikipédia',
      fileUrl: 'https://fr.wikipedia.org/wiki/Wikipédia:Image_du_jour',
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
    })
  } catch (error) {
    console.error('Wikipedia image error:', error)
    return NextResponse.json({
      imageUrl: '',
      description: 'Image du jour — Wikipédia',
      fileUrl: 'https://fr.wikipedia.org/wiki/Wikipédia:Image_du_jour',
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
    })
  }
}
