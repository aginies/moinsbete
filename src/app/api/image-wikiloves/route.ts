import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { searchCommonsFiles, fetchCommonsImageInfo, type CommonsImage } from '@/lib/wikimedia-commons'

const WIKILOVES_EVENTS: Record<string, string[]> = {
  wle: ['Wiki Loves Earth'],
  wlm: ['Wiki Loves Monuments'],
}

async function fetchFromCache(source: string): Promise<CommonsImage | null> {
  try {
    const now = new Date()
    const totalCached = await prisma.cachedWikiLovesImage.count({
      where: {
        source,
        expiresAt: { gte: now },
      },
    })

    console.log(`[WikiLoves] Cache check for ${source}: ${totalCached} valid entries`)

    if (totalCached === 0) return null

    const randomOffset = Math.floor(Math.random() * totalCached)
    const random = await prisma.cachedWikiLovesImage.findFirst({
      where: {
        source,
        expiresAt: { gte: now },
      },
      skip: randomOffset,
    })

    if (!random) {
      console.log(`[WikiLoves] No image found for source ${source}`)
      return null
    }

    console.log(`[WikiLoves] Returning cached image from ${source}: ${random.title}`)

    return {
      docid: random.docid,
      titre: random.title,
      auteur: random.author,
      imageUrl: random.imageUrl,
      zoomUrl: random.imageUrl,
      thumbnailUrl: random.imageUrl,
      description: '',
      droits: random.license,
      link: random.commonsUrl || `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(random.docid)}`,
    }
  } catch (e) {
    console.error(`[WikiLoves] Error in fetchFromCache(${source}):`, e)
    return null
  }
}

async function cacheFallbackImage(image: CommonsImage): Promise<void> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  await prisma.cachedWikiLovesImage.upsert({
    where: { docid: image.docid },
    update: { title: image.titre, author: image.auteur, imageUrl: image.imageUrl, commonsUrl: image.link, license: image.droits, year: new Date().getFullYear(), source: 'FALLBACK', scrapedAt: now, expiresAt },
    create: { docid: image.docid, title: image.titre, author: image.auteur, imageUrl: image.imageUrl, commonsUrl: image.link, license: image.droits, year: new Date().getFullYear(), source: 'FALLBACK', scrapedAt: now, expiresAt },
  })
}

async function fetchRandomImage(event?: string): Promise<CommonsImage | null> {
  console.log('[WikiLoves] fetchRandomImage called with event:', event)
  const events = event && WIKILOVES_EVENTS[event] ? [event] : Object.keys(WIKILOVES_EVENTS)

  for (const evt of events) {
    console.log(`[WikiLoves] Checking cache for ${evt}...`)
    if (evt === 'wlm') {
      const cached = await fetchFromCache('MONUMENTS')
      if (cached) {
        console.log(`[WikiLoves] Returning MONUMENTS image`)
        return cached
      }
    }
    if (evt === 'wle') {
      const cached = await fetchFromCache('EARTH')
      if (cached) {
        console.log(`[WikiLoves] Returning EARTH image`)
        return cached
      }
    }
  }

  console.log('[WikiLoves] No cached images found, checking FALLBACK...')
  const cachedFallback = await fetchFromCache('FALLBACK')
  if (cachedFallback) {
    console.log(`[WikiLoves] Returning FALLBACK image`)
    return cachedFallback
  }

  console.log('[WikiLoves] FALLBACK empty, searching Commons API...')
  const fallbackSearchTerms = ['Wiki Loves Earth', 'Wiki Loves Monuments', 'Nature', 'Architecture', 'France', 'Wildlife']
  const shuffled = fallbackSearchTerms.sort(() => Math.random() - 0.5)

  for (const term of shuffled) {
    console.log(`[WikiLoves] Searching Commons for: ${term}`)
    const files = await searchCommonsFiles(term)
    if (files.length === 0) continue

    const shuffledFiles = [...files].sort(() => Math.random() - 0.5)
    const maxAttempts = Math.min(shuffledFiles.length, 5)

    for (let i = 0; i < maxAttempts; i++) {
      const image = await fetchCommonsImageInfo(shuffledFiles[i])
      if (image && image.imageUrl) {
        console.log(`[WikiLoves] Found image from Commons: ${image.titre}, caching as FALLBACK`)
        await cacheFallbackImage(image)
        return image
      }
    }
  }

  console.log('[WikiLoves] No images found at all')
  return null
}

export async function GET(request: NextRequest) {
  console.log('[WikiLoves] GET handler called')
  const eventParam = request.nextUrl.searchParams.get('event') || undefined
  let event: string | undefined = undefined
  if (eventParam) {
    const events = eventParam.split(',').map(t => t.trim()).filter(Boolean)
    if (events.length > 0) event = events[Math.floor(Math.random() * events.length)]
  }
  console.log('[WikiLoves] Event param:', event)
  const image = await fetchRandomImage(event)
  if (!image) {
    console.log('[WikiLoves] No image returned')
    return NextResponse.json({ error: true })
  }
  console.log('[WikiLoves] Returning image:', image.titre)
  return NextResponse.json(image)
}
