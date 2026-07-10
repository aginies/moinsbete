import { NextResponse } from 'next/server'

interface GallicaImage {
  docid: string
  reference?: string
  titre: string
  auteur: string
  imageUrl: string
  zoomUrl: string
  description: string
  droits: string
  link: string
}

const GALLERY_BASE = 'https://images.bnf.fr/scripts/atlasgate.dll/bnf6db'
const TOTAL_IMAGES = 990000
const PER_PAGE = 20

async function getSession(): Promise<string> {
  try {
    const res = await fetch('https://images.bnf.fr', {
      signal: AbortSignal.timeout(5000),
    })
    const html = await res.text()
    const match = html.match(/"value"\s*:\s*"([^"]+)"/)
    if (match) return match[1]
    return ''
  } catch {
    return ''
  }
}

async function fetchGalleryPage(page: number, session: string): Promise<GallicaImage[]> {
  try {
    const res = await fetch(
      `${GALLERY_BASE}/ws_docList?search=%2A&tbname=IMAGE&length=${PER_PAGE}&page=${page}&lang=fra&session=${session}&sort=defsortbnf&sortway=desc&columns=docid%20reference%20titre%20description%20annee%20sujets%20exemplaire`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(10000),
        next: { revalidate: 300 },
      }
    )
    if (!res.ok) return []
    const data = await res.json()
    const items = data?.data || []
    return items.map((item: Record<string, { value: string | number }>) => {
      const docid = item.docid?.value || ''
      const exemplaire = item.exemplaire?.value || ''
      const reference = item.reference?.value || ''
      const baseUrl = `${GALLERY_BASE}/wa_zoom?site=IMAGE&SID=${session}&docid=${docid}&ex=${exemplaire}`
      const link = `https://images.bnf.fr/#/detail/${docid}/${exemplaire}`
      return {
        docid: String(docid),
        exemplaire: String(exemplaire),
        reference: String(reference),
        titre: item.titre2?.value || '',
        auteur: item.auteur?.value || '',
        imageUrl: baseUrl,
        zoomUrl: baseUrl,
        thumbnailUrl: `${GALLERY_BASE}/wa_vignette?docid=${docid}&SID=${session}&psite=IMAGE`,
        link,
      }
    })
  } catch {
    return []
  }
}

async function fetchRandomImage(): Promise<GallicaImage | null> {
  const session = await getSession()
  if (!session) return null

  const randomPage = Math.floor(Math.random() * (TOTAL_IMAGES / PER_PAGE)) + 1
  const items = await fetchGalleryPage(randomPage, session)
  if (items.length === 0) return null

  return items[Math.floor(Math.random() * items.length)]
}

export async function GET() {
  const image = await fetchRandomImage()
  if (!image) {
    return NextResponse.json({ error: true })
  }
  return NextResponse.json(image)
}
