import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limiter'
import { resolveWikimediaImageUrlsViaREST } from '@/lib/utils'
import { getClientIp } from '@/lib/ip'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'
import { createTtlCache } from '@/lib/ttl-cache'

const imageCache = createTtlCache<string>({ ttlMs: 24 * 60 * 60 * 1000 })

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const count = Math.min(parseInt(searchParams.get('count') || '1'), 10)

    const clientId = getClientIp(request)
    if (!(await checkRateLimit(`saviez-vous:${clientId}`, 20, 60_000))) {
      return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
    }

    const total = await prisma.saviezVousFact.count()
    if (total === 0) {
      return NextResponse.json({ facts: [] })
    }

    const randomOffset = Math.floor(Math.random() * Math.max(total - count + 1, 1))
    const facts = await prisma.saviezVousFact.findMany({
      skip: randomOffset,
      take: count,
      select: {
        id: true,
        text: true,
        sourceUrl: true,
        imageFilename: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!facts.length) {
      return NextResponse.json({ facts: [] })
    }

    // Check in-memory cache
    for (const fact of facts) {
      if (fact.imageFilename?.startsWith('http')) continue
      const cached = imageCache.get(fact.imageFilename!)
      if (cached) fact.imageFilename = cached
    }

    // Resolve only facts without cached URLs (response-time only, no DB write)
    const pending = facts
      .filter(f => !f.imageFilename?.startsWith('http'))
      .map(f => f.imageFilename!)

    if (pending.length > 0) {
      try {
        const titles = pending.map(f => `File:${f}`).join('|')
        const res = await fetch(
          `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url&format=json&origin=*`,
          { headers: { 'User-Agent': 'moinsbete/1.0' } }
        )
        if (res.ok) {
          const data = await res.json()
          const pages = data?.query?.pages || {}
          for (const pageId of Object.keys(pages)) {
            const page = pages[pageId]
            const url = page?.imageinfo?.[0]?.url
            if (url) {
              const filename = page.title.replace(/^File:/, '')
              const fact = facts.find(f => f.imageFilename === filename)
              if (fact) {
                fact.imageFilename = url
                imageCache.set(filename, url)
              }
            }
          }
        }
      } catch {
        // Continue to fallback
      }

      // REST API fallback
      const unresolved = facts
        .filter(f => f.imageFilename && !f.imageFilename.startsWith('http'))
        .map(f => f.imageFilename!)
      if (unresolved.length > 0) {
        const restUrls = await resolveWikimediaImageUrlsViaREST(unresolved)
        for (const fact of facts) {
          if (!fact.imageFilename || fact.imageFilename.startsWith('http')) continue
          if (restUrls.has(fact.imageFilename)) {
            fact.imageFilename = restUrls.get(fact.imageFilename)!
            imageCache.set(fact.imageFilename, fact.imageFilename)
          }
        }
      }
    }

    // Final fallback: Special:FilePath URL construction
    for (const fact of facts) {
      if (!fact.imageFilename || fact.imageFilename.startsWith('http')) continue
      fact.imageFilename = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fact.imageFilename)}?width=1200`
    }

    return NextResponse.json({ facts })
  } catch (error) {
    console.error('Saviez-vous error:', error)
    return NextResponse.json({ facts: [] })
  }
}
