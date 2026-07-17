import { NextRequest, NextResponse } from 'next/server'

interface PixabayVideo {
  id: number
  pageURL: string
  author: string
  authorProfileUrl: string
  duration: number
  thumbnailUrl: string
  videoUrl: string
  tags: string
}

const PIXABAY_API = 'https://pixabay.com/api/videos/'
const API_KEY = process.env.PIXABAY_API_KEY

const CATEGORIES = [
  { id: 'forest', label: 'Forêt', icon: '🌲' },
  { id: 'sunset', label: 'Coucher de soleil', icon: '🌅' },
  { id: 'landscape', label: 'Paysage', icon: '🏔️' },
  { id: 'sky', label: 'Ciel', icon: '☁️' },
  { id: 'beach', label: 'Plage', icon: '🏖️' },
  { id: 'cat', label: 'Chat', icon: '🐱' },
  { id: 'dog', label: 'Chien', icon: '🐶' },
  { id: 'flowers', label: 'Fleurs', icon: '🌸' },
]

async function fetchRandomVideo(category: string): Promise<PixabayVideo | null> {
  if (!API_KEY) {
    return null
  }

  const params = new URLSearchParams({
    key: API_KEY,
    q: category,
    order: 'popular',
    per_page: '20',
  })

  for (let retry = 0; retry < 3; retry++) {
    try {
      const res = await fetch(`${PIXABAY_API}?${params}`, {
        signal: AbortSignal.timeout(15000),
      })

      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 1000 * (retry + 1)))
        continue
      }

      if (!res.ok) return null

      const data = await res.json()
      const hits = data.hits || []

      if (hits.length === 0) return null

      const randomVideo = hits[Math.floor(Math.random() * hits.length)]
      const mediumVideo = randomVideo.videos?.medium || randomVideo.videos?.small

      if (!mediumVideo?.url) return null

      return {
        id: randomVideo.id,
        pageURL: randomVideo.pageURL,
        author: randomVideo.user || '',
        authorProfileUrl: `https://pixabay.com/users/${randomVideo.user}-${randomVideo.user_id}/`,
        duration: randomVideo.duration || 0,
        thumbnailUrl: mediumVideo.thumbnail || '',
        videoUrl: mediumVideo.url,
        tags: randomVideo.tags || '',
      }
    } catch {
      await new Promise(r => setTimeout(r, 500 * (retry + 1)))
    }
  }

  return null
}

export async function GET(request: NextRequest) {
  const categoryParam = request.nextUrl.searchParams.get('category') || 'nature'

  const video = await fetchRandomVideo(categoryParam)
  if (!video) {
    return NextResponse.json({ error: true })
  }

  return NextResponse.json(video)
}
