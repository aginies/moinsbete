import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface WikiLovesImage {
  docid: string
  titre: string
  auteur: string
  imageUrl: string
  zoomUrl: string
  thumbnailUrl: string
  description: string
  droits: string
  link: string
}

const WIKILOVES_EVENTS: Record<string, string[]> = {
  wle: ['Wiki Loves Earth'],
  wlm: ['Wiki Loves Monuments'],
}

function stripHtml(html: string): string {
  const decoded = html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")

  const frRegex = /<([a-z1-6]+)[^>]*\blang=["']fr["'][^>]*>([\s\S]*?)<\/\1>/gi
  const frMatch = frRegex.exec(decoded)
  if (frMatch && frMatch[2]) return frMatch[2].replace(/<[^>]*>/g, '').trim()

  const frClassRegex = /<([a-z1-6]+)[^>]*\bclass=["'][^"']*\bfr\b[^"']*?["'][^>]*>([\s\S]*?)<\/\1>/gi
  const frClassMatch = frClassRegex.exec(decoded)
  if (frClassMatch && frClassMatch[2]) return frClassMatch[2].replace(/<[^>]*>/g, '').trim()

  const enRegex = /<([a-z1-6]+)[^>]*\blang=["']en["'][^>]*>([\s\S]*?)<\/\1>/gi
  const enMatch = enRegex.exec(decoded)
  if (enMatch && enMatch[2]) return enMatch[2].replace(/<[^>]*>/g, '').trim()

  const enClassRegex = /<([a-z1-6]+)[^>]*\bclass=["'][^"']*\ben\b[^"']*?["'][^>]*>([\s\S]*?)<\/\1>/gi
  const enClassMatch = enClassRegex.exec(decoded)
  if (enClassMatch && enClassMatch[2]) return enClassMatch[2].replace(/<[^>]*>/g, '').trim()

  return decoded.replace(/<[^>]*>/g, '').trim()
}

async function searchFiles(query: string): Promise<string[]> {
  const offset = Math.floor(Math.random() * 1000)
  for (let retry = 0; retry < 3; retry++) {
    try {
      const res = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=300&sroffset=${offset}&srnamespace=6&format=json`,
        {
          headers: { 'User-Agent': 'MoinsBeteApp/1.0 (moinsbete@ginies.org)' },
          signal: AbortSignal.timeout(10000),
        }
      )
      if (res.status === 429 || res.status === 403) {
        await new Promise(r => setTimeout(r, 1000 * (retry + 1)))
        continue
      }
      if (!res.ok) return []
      const data = await res.json()
      const files = (data?.query?.search || []).map((r: Record<string, unknown>) => r.title).filter((t: string) => t.startsWith('File:'))
      if (files.length > 0) return files
      if (offset > 0) {
        const fallbackRes = await fetch(
          `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=300&sroffset=0&srnamespace=6&format=json`,
          {
            headers: { 'User-Agent': 'MoinsBeteApp/1.0 (moinsbete@ginies.org)' },
            signal: AbortSignal.timeout(10000),
          }
        )
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json()
          return (fallbackData?.query?.search || []).map((r: Record<string, unknown>) => r.title).filter((t: string) => t.startsWith('File:'))
        }
      }
      return []
    } catch {
      await new Promise(r => setTimeout(r, 500 * (retry + 1)))
    }
  }
  return []
}

async function fetchImageInfo(filename: string): Promise<WikiLovesImage | null> {
  const cleanFilename = filename.replace(/^File:/i, '')
  for (let retry = 0; retry < 5; retry++) {
    try {
      const res = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(cleanFilename)}&prop=imageinfo&iiprop=url|size|mime|thumburl|extmetadata&eeprop=artist|description|licensename|title|descriptionlang|descriptiontext|url&format=json`,
        {
          headers: { 'User-Agent': 'MoinsBeteApp/1.0 (moinsbete@ginies.org)' },
          signal: AbortSignal.timeout(15000),
        }
      )
      if (res.status === 429 || res.status === 403) {
        await new Promise(r => setTimeout(r, 2000 * (retry + 1)))
        continue
      }
      if (!res.ok) return null
      const data = await res.json()
      const pages = data?.query?.pages || {}
      const page = Object.values(pages)[0] as Record<string, unknown>
      if (!page || page.error || page.missing) return null

      const imageinfo = page.imageinfo || []
      if (imageinfo.length === 0) return null

      const img = imageinfo[0]
      const extmetadata = img.extmetadata || {}

      const titleEntry = extmetadata['Title'] || extmetadata['ObjectName']
      const title = stripHtml(titleEntry?.value || cleanFilename)
      const artist = stripHtml(extmetadata['Artist']?.value || '')

      const rawDescription = extmetadata['ImageDescription']?.value || extmetadata['Description']?.value || extmetadata['Descriptiontext']?.value || ''
      const description = stripHtml(rawDescription)

      const licenseName = extmetadata['LicenseShortName']?.value || extmetadata['LicenseName']?.value || ''
      const mime = img.mime || 'image/jpeg'

      const isColorImage = mime === 'image/jpeg' || mime === 'image/jpg' || mime === 'image/png' || mime === 'image/gif' || mime === 'image/webp' || mime === 'image/bmp' || mime === 'image/avif'
      const imageUrl = isColorImage ? img.url : ''
      const thumbnailUrl = img.thumburl || img.thumbnail?.url || (isColorImage ? img.url : '')

      if (!imageUrl) return null

      const wikimediaLink = img.descriptionurl || `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(cleanFilename)}`

      return {
        docid: cleanFilename,
        titre: title,
        auteur: artist,
        imageUrl,
        zoomUrl: img.url || '',
        thumbnailUrl,
        description,
        droits: licenseName || 'Wikimedia Commons',
        link: wikimediaLink,
      }
    } catch {
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  return null
}

async function fetchFromCache(source: string): Promise<WikiLovesImage | null> {
  const now = new Date()
  const totalCached = await prisma.cachedWikiLovesImage.count({
    where: {
      source,
      expiresAt: { gte: now },
    },
  })

  if (totalCached === 0) return null

  const randomOffset = Math.floor(Math.random() * totalCached)
  const random = await prisma.cachedWikiLovesImage.findFirst({
    where: {
      source,
      expiresAt: { gte: now },
    },
    skip: randomOffset,
  })

  if (!random) return null

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
}

async function fetchRandomImage(event?: string): Promise<WikiLovesImage | null> {
  const events = event && WIKILOVES_EVENTS[event] ? [event] : Object.keys(WIKILOVES_EVENTS)
  
  for (const evt of events) {
    if (evt === 'wlm') {
      const cached = await fetchFromCache('MONUMENTS')
      if (cached) return cached
    }
    if (evt === 'wle') {
      const cached = await fetchFromCache('EARTH')
      if (cached) return cached
    }
  }

  const searchTerms: string[] = []
  for (const evt of events) {
    if (WIKILOVES_EVENTS[evt]) searchTerms.push(...WIKILOVES_EVENTS[evt])
  }
  searchTerms.sort(() => Math.random() - 0.5)

  for (const term of searchTerms) {
    const files = await searchFiles(term)
    if (files.length === 0) continue
    const shuffledFiles = [...files].sort(() => Math.random() - 0.5)
    const maxAttempts = Math.min(shuffledFiles.length, 5)
    for (let i = 0; i < maxAttempts; i++) {
      const image = await fetchImageInfo(shuffledFiles[i])
      if (image && image.imageUrl) return image
    }
  }
  return null
}

export async function GET(request: NextRequest) {
  const eventParam = request.nextUrl.searchParams.get('event') || undefined
  let event: string | undefined = undefined
  if (eventParam) {
    const events = eventParam.split(',').map(t => t.trim()).filter(Boolean)
    if (events.length > 0) event = events[Math.floor(Math.random() * events.length)]
  }
  const image = await fetchRandomImage(event)
  if (!image) return NextResponse.json({ error: true })
  return NextResponse.json(image)
}
