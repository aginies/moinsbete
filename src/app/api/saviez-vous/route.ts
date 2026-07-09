import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { resolveWikimediaImageUrls } from '@/lib/utils'
import crypto from 'node:crypto'
import { checkRateLimit } from '@/lib/rate-limiter'
import { resolveWikimediaImageUrlsViaREST } from '@/lib/utils'
import { getClientIp } from '@/lib/ip'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'

interface ImageCacheEntry {
  url: string
  expiresAt: number
}

const imageCache = new Map<string, ImageCacheEntry>()
const IMAGE_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

function getCachedImageUrl(imageFilename: string): string | null {
  const cached = imageCache.get(imageFilename)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url
  }
  if (cached) {
    imageCache.delete(imageFilename)
  }
  return null
}

function setCachedImageUrl(imageFilename: string, url: string) {
  imageCache.set(imageFilename, {
    url,
    expiresAt: Date.now() + IMAGE_CACHE_TTL,
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const count = Math.min(parseInt(searchParams.get('count') || '1'), 10)

    const clientId = getClientIp(request)
    if (!checkRateLimit(`saviez-vous:${clientId}`, 20, 60_000)) {
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

    // Check cache for already resolved URLs
    for (const fact of facts) {
      if (fact.imageFilename?.startsWith('http')) {
        continue
      }
      const cachedUrl = getCachedImageUrl(fact.imageFilename!)
      if (cachedUrl) {
        fact.imageFilename = cachedUrl
      }
    }

    // Resolve only facts without cached URLs
    const pending = facts
      .filter(f => !f.imageFilename?.startsWith('http'))
      .map(f => ({ id: f.id, imageFilename: f.imageFilename }))

    if (pending.length > 0) {
      const titles = pending.map(f => `File:${f.imageFilename}`).join('|')
      try {
        const res = await fetch(
          `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url&format=json&origin=*`,
          { headers: { 'User-Agent': 'moinsbete/1.0' } }
        )
        const data = await res.json()
        const pages = data?.query?.pages || {}

        for (const pageId of Object.keys(pages)) {
          const page = pages[pageId]
          const url = page?.imageinfo?.[0]?.url
          if (url) {
            const pendingFact = pending.find(f => f.imageFilename === page.title.replace(/^File:/, ''))
            if (pendingFact) {
              const original = facts.find(f => f.id === pendingFact.id)
              if (original && original.imageFilename !== url) {
                original.imageFilename = url
                setCachedImageUrl(pendingFact.imageFilename!, url)
                await prisma.saviezVousFact.update({
                  where: { id: original.id },
                  data: { imageFilename: url },
                })
              }
            }
          }
        }
      } catch {
        // If API fails, keep original filenames
      }

      // Fallback: construct direct Wikimedia URL for facts still not resolved
      const unresolvedFilenames = facts
        .filter(f => f.imageFilename && !f.imageFilename.startsWith('http'))
        .map(f => f.imageFilename!)

      const restUrls = await resolveWikimediaImageUrlsViaREST(unresolvedFilenames)

      for (const fact of facts) {
        if (!fact.imageFilename || fact.imageFilename.startsWith('http')) continue

        // Use REST API resolved URL if available
        if (restUrls.has(fact.imageFilename)) {
          const url = restUrls.get(fact.imageFilename)!
          fact.imageFilename = url
          setCachedImageUrl(fact.imageFilename, url)
          await prisma.saviezVousFact.update({
            where: { id: fact.id },
            data: { imageFilename: url },
          })
          continue
        }

        // Use Special:FilePath redirect - works for all filenames including special chars
        const specialUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fact.imageFilename)}?width=1200`
        fact.imageFilename = specialUrl
        setCachedImageUrl(fact.imageFilename, specialUrl)
        await prisma.saviezVousFact.update({
          where: { id: fact.id },
          data: { imageFilename: specialUrl },
        })
      }
    }

    // Final fallback: use Special:FilePath for any still unresolved
    for (const fact of facts) {
      if (!fact.imageFilename || fact.imageFilename.startsWith('http')) continue
      fact.imageFilename = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fact.imageFilename)}?width=1200`
    }

    // Final fallback: use Special:FilePath redirect for any remaining unresolved images
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
