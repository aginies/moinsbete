import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface WikimediaImage {
  docid: string
  reference?: string
  titre: string
  auteur: string
  imageUrl: string
  zoomUrl: string
  thumbnailUrl: string
  description: string
  droits: string
  link: string
}

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php'

const DEFAULT_TOPIC_SEARCHES: Record<string, string[]> = {
  paintings: ['Painting', 'Oil painting', 'Watercolor', 'Dali'],
  aviation: ['Avion Chasse', 'Armée Air', 'Air force'],
  nasa: ['NASA', 'Apollo program'],
  posters: ['Poster', 'Movie poster'],
  ww: ['World War II', 'Second World War', '1939-1945', 'World War I', 'First World War', 'Great War', '1914-1918'],
  art: ['Art', 'Sculpture', 'Illustration', 'Drawing', 'Musé Louvre', 'Musé Ermitage', 'Musée national de Chine', 'Metropolitan Museum of Art', 'Musées du Vatican'],
  advertisements: ['Vintage advertisement', 'Vintage ad', 'Retro ad', 'Poster advertisement'],
  maps: ['Historical map', 'Old map', 'Antique map', 'Cartography'],
  'sports-car': ['Classic sports car', 'Sports car', 'Racing car', 'Rolls-Royce', 'Bentley', 'Ferrari', 'Lamborghini', 'Porsche'],
  design: ['Industrial design', 'Graphic design', 'Product design', 'Modernist design', 'objets design', 'architecture design'],
  'deep-space': ['Deep space', 'Nebula', 'Hubble space telescope', 'Andromeda galaxy', 'Supernova'],
}

const DEFAULT_TOPIC_IDS = [
  'paintings', 'aviation', 'nasa', 'posters', 'ww', 'art',
  'advertisements', 'maps', 'sports-car', 'design', 'deep-space',
]

async function getTopicSearches(): Promise<Record<string, string[]>> {
  const searches: Record<string, string[]> = { ...DEFAULT_TOPIC_SEARCHES }
  
  const dbTopics = await prisma.userWikimediaTopic.findMany({})
  
  for (const dbTopic of dbTopics as any) {
    let searchTerms: string[] = []
    if (dbTopic.searchTerms) {
      try {
        const raw = dbTopic.searchTerms
        if (Array.isArray(raw)) {
          searchTerms = raw
        } else if (typeof raw === 'string') {
          searchTerms = JSON.parse(raw)
        }
      } catch {
        searchTerms = []
      }
    }
    if (searchTerms.length > 0) {
      searches[dbTopic.topicId] = searchTerms
    }
  }
  
  return searches
}

function stripHtml(html: string): string {
  const decoded = html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")

  // Try to find a French block: e.g. <span lang="fr">...</span>
  const frRegex = /<([a-z1-6]+)[^>]*\blang=["']fr["'][^>]*>([\s\S]*?)<\/\1>/gi
  const frMatch = frRegex.exec(decoded)
  if (frMatch && frMatch[2]) {
    return frMatch[2].replace(/<[^>]*>/g, '').trim()
  }

  // Try class="fr"
  const frClassRegex = /<([a-z1-6]+)[^>]*\bclass=["'][^"']*\bfr\b[^"']*?["'][^>]*>([\s\S]*?)<\/\1>/gi
  const frClassMatch = frClassRegex.exec(decoded)
  if (frClassMatch && frClassMatch[2]) {
    return frClassMatch[2].replace(/<[^>]*>/g, '').trim()
  }

  // Try English block: lang="en"
  const enRegex = /<([a-z1-6]+)[^>]*\blang=["']en["'][^>]*>([\s\S]*?)<\/\1>/gi
  const enMatch = enRegex.exec(decoded)
  if (enMatch && enMatch[2]) {
    return enMatch[2].replace(/<[^>]*>/g, '').trim()
  }

  // Try class="en"
  const enClassRegex = /<([a-z1-6]+)[^>]*\bclass=["'][^"']*\ben\b[^"']*?["'][^>]*>([\s\S]*?)<\/\1>/gi
  const enClassMatch = enClassRegex.exec(decoded)
  if (enClassMatch && enClassMatch[2]) {
    return enClassMatch[2].replace(/<[^>]*>/g, '').trim()
  }

  return decoded.replace(/<[^>]*>/g, '').trim()
}

async function searchFiles(topic: string): Promise<string[]> {
  // Generate a random search offset to select from different pages of results (up to the first 1000 items)
  const offset = Math.floor(Math.random() * 1000)
  for (let retry = 0; retry < 3; retry++) {
    try {
      const res = await fetch(
        `${COMMONS_API}?action=query&list=search&srsearch=${encodeURIComponent(topic)}&srlimit=300&sroffset=${offset}&srnamespace=6&format=json`,
        {
          headers: {
            'User-Agent': 'MoinsBeteApp/1.0 (moinsbete@ginies.org)'
          },
          signal: AbortSignal.timeout(10000)
        }
      )
      if (res.status === 429 || res.status === 403) {
        await new Promise(r => setTimeout(r, 1000 * (retry + 1)))
        continue
      }
      if (!res.ok) return []
      const data = await res.json()
      const files = (data?.query?.search || []).map((r: any) => r.title).filter((t: string) => t.startsWith('File:'))
      
      if (files.length > 0) return files
      
      // If we got 0 results (because the offset was too high for a smaller topic), fallback to offset 0 (first page)
      if (offset > 0) {
        const fallbackRes = await fetch(
          `${COMMONS_API}?action=query&list=search&srsearch=${encodeURIComponent(topic)}&srlimit=300&sroffset=0&srnamespace=6&format=json`,
          {
            headers: {
              'User-Agent': 'MoinsBeteApp/1.0 (moinsbete@ginies.org)'
            },
            signal: AbortSignal.timeout(10000)
          }
        )
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json()
          return (fallbackData?.query?.search || []).map((r: any) => r.title).filter((t: string) => t.startsWith('File:'))
        }
      }
      return []
    } catch {
      await new Promise(r => setTimeout(r, 500 * (retry + 1)))
    }
  }
  return []
}

async function fetchImageInfo(filename: string): Promise<WikimediaImage | null> {
  const cleanFilename = filename.replace(/^File:/i, '')
  for (let retry = 0; retry < 5; retry++) {
    try {
      const res = await fetch(
        `${COMMONS_API}?action=query&titles=File:${encodeURIComponent(cleanFilename)}&prop=imageinfo&iiprop=url|size|mime|thumburl|extmetadata&eeprop=artist|description|licensename|title|descriptionlang|descriptiontext|url&format=json`,
        {
          headers: {
            'User-Agent': 'MoinsBeteApp/1.0 (moinsbete@ginies.org)'
          },
          signal: AbortSignal.timeout(15000)
        }
      )
      if (res.status === 429 || res.status === 403) {
        await new Promise(r => setTimeout(r, 2000 * (retry + 1)))
        continue
      }
      if (!res.ok) return null
      const data = await res.json()
      const pages = data?.query?.pages || {}
      const page = Object.values(pages)[0] as Record<string, any>
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

      // Only accept browser-compatible image formats (exclude TIFFs, PDFs, SVGs, etc. which fail to load in browser <img> tags)
      const isColorImage =
        mime === 'image/jpeg' ||
        mime === 'image/jpg' ||
        mime === 'image/png' ||
        mime === 'image/gif' ||
        mime === 'image/webp' ||
        mime === 'image/bmp' ||
        mime === 'image/avif'
      const imageUrl = isColorImage ? img.url : ''
      const thumbnailUrl = img.thumburl || img.thumbnail?.url || (isColorImage ? img.url : '')

      if (!imageUrl) return null

      const wikimediaLink = img.descriptionurl || `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(cleanFilename)}`

      return {
        docid: cleanFilename,
        reference: '',
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

async function fetchRandomImage(topic?: string): Promise<WikimediaImage | null> {
  const searches = await getTopicSearches()
  const searchTerms = topic && searches[topic] ? [...searches[topic]] : ['France']
  
  // Shuffle search terms to avoid always hitting the first term
  searchTerms.sort(() => Math.random() - 0.5)

  for (const term of searchTerms) {
    const files = await searchFiles(term)
    if (files.length === 0) continue

    // Shuffle the files list and try up to 5 different candidate files in sequence
    // to find one that successfully resolves a valid, browser-compatible image.
    const shuffledFiles = [...files].sort(() => Math.random() - 0.5)
    const maxAttempts = Math.min(shuffledFiles.length, 5)

    for (let i = 0; i < maxAttempts; i++) {
      const randomFile = shuffledFiles[i]
      const image = await fetchImageInfo(randomFile)
      if (image && image.imageUrl) {
        return image
      }
    }
  }

  return null
}

export async function GET(request: NextRequest) {
  const topicParam = request.nextUrl.searchParams.get('topic') || undefined
  
  let topic: string | undefined = undefined
  if (topicParam) {
    const topics = topicParam.split(',').map(t => t.trim()).filter(Boolean)
    if (topics.length > 0) {
      topic = topics[Math.floor(Math.random() * topics.length)]
    }
  }

  const image = await fetchRandomImage(topic)
  if (!image) {
    return NextResponse.json({ error: true })
  }
  return NextResponse.json(image)
}
