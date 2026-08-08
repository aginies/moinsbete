import { prisma } from '@/lib/db'

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php'

export interface CommonsImage {
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

export function stripHtml(html: string): string {
  const decoded = html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")

  const frRegex = /<([a-z1-6]+)[^>]*\blang=["']fr["'][^>]*>([\s\S]*?)<\/\1>/gi
  const frMatch = frRegex.exec(decoded)
  if (frMatch && frMatch[2]) {
    return frMatch[2].replace(/<[^>]*>/g, '').trim()
  }

  const frClassRegex = /<([a-z1-6]+)[^>]*\bclass=["'][^"']*\bfr\b[^"']*?["'][^>]*>([\s\S]*?)<\/\1>/gi
  const frClassMatch = frClassRegex.exec(decoded)
  if (frClassMatch && frClassMatch[2]) {
    return frClassMatch[2].replace(/<[^>]*>/g, '').trim()
  }

  const enRegex = /<([a-z1-6]+)[^>]*\blang=["']en["'][^>]*>([\s\S]*?)<\/\1>/gi
  const enMatch = enRegex.exec(decoded)
  if (enMatch && enMatch[2]) {
    return enMatch[2].replace(/<[^>]*>/g, '').trim()
  }

  const enClassRegex = /<([a-z1-6]+)[^>]*\bclass=["'][^"']*\ben\b[^"']*?["'][^>]*>([\s\S]*?)<\/\1>/gi
  const enClassMatch = enClassRegex.exec(decoded)
  if (enClassMatch && enClassMatch[2]) {
    return enClassMatch[2].replace(/<[^>]*>/g, '').trim()
  }

  return decoded.replace(/<[^>]*>/g, '').trim()
}

export async function searchCommonsFiles(topic: string): Promise<string[]> {
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
      const files = (data?.query?.search || []).map((r: Record<string, unknown>) => r.title).filter((t: string) => t.startsWith('File:'))

      if (files.length > 0) return files

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

export async function fetchCommonsImageInfo(filename: string): Promise<CommonsImage | null> {
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
      const page = Object.values(pages)[0] as Record<string, unknown>
      if (!page || page.error || page.missing) return null

      const imageinfo = (page.imageinfo || []) as unknown[]
      if (imageinfo.length === 0) return null

      const img = imageinfo[0] as { url?: string; thumburl?: string; thumbnail?: { url?: string }; mime?: string; extmetadata?: Record<string, { value?: string }>; descriptionurl?: string }
      const extmetadata = img.extmetadata || {}

      const titleEntry = extmetadata['Title'] || extmetadata['ObjectName']
      const title = stripHtml(titleEntry?.value || cleanFilename)
      const artist = stripHtml(extmetadata['Artist']?.value || '')

      const rawDescription = extmetadata['ImageDescription']?.value || extmetadata['Description']?.value || extmetadata['Descriptiontext']?.value || ''
      const description = stripHtml(rawDescription)

      const licenseName = extmetadata['LicenseShortName']?.value || extmetadata['LicenseName']?.value || ''
      const mime = img.mime || 'image/jpeg'

      const isColorImage =
        mime === 'image/jpeg' ||
        mime === 'image/jpg' ||
        mime === 'image/png' ||
        mime === 'image/gif' ||
        mime === 'image/webp' ||
        mime === 'image/bmp' ||
        mime === 'image/avif'
      const imageUrl = isColorImage ? img.url : ''
      const thumbnailUrl = img.thumburl || img.thumbnail?.url || (isColorImage ? img.url : '') || ''

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

export async function getWikimediaTopicSearches(): Promise<Record<string, string[]>> {
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

  const searches: Record<string, string[]> = { ...DEFAULT_TOPIC_SEARCHES }

  const dbTopics = await prisma.userWikimediaTopic.findMany({ take: 1000 })

  for (const dbTopic of dbTopics) {
    let searchTerms: string[] = []
    if (dbTopic.searchTerms) {
      try {
        const raw = dbTopic.searchTerms
        if (Array.isArray(raw)) {
          searchTerms = raw.filter((t): t is string => typeof t === 'string')
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
