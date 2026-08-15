import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/ip'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'
import { getCachedPool } from '@/lib/feed-pool-cache'

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

async function fetchVideoPool(category: string): Promise<PixabayVideo[]> {
  if (!API_KEY) {
    return []
  }

  const params = new URLSearchParams({
    key: API_KEY,
    q: category,
    order: 'popular',
    per_page: '200',
    page: '1',
  })

  for (let retry = 0; retry < 3; retry++) {
    try {
      const res = await fetch(`${PIXABAY_API}?${params}`, {
        signal: AbortSignal.timeout(30000),
      })

      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 1000 * (retry + 1)))
        continue
      }

      if (!res.ok) {
        console.log('[pixabay] HTTP error:', res.status, await res.text())
        return []
      }

      const data = await res.json()
      console.log('[pixabay] API response:', data.totalHits, 'hits')
      const hits = data.hits || []

      const videos: PixabayVideo[] = []
      for (const hit of hits) {
        const mediumVideo = hit.videos?.medium || hit.videos?.small
        if (!mediumVideo?.url) continue
        videos.push({
          id: hit.id,
          pageURL: hit.pageURL,
          author: hit.user || '',
          authorProfileUrl: `https://pixabay.com/users/${hit.user}-${hit.user_id}/`,
          duration: hit.duration || 0,
          thumbnailUrl: mediumVideo.thumbnail || '',
          videoUrl: mediumVideo.url,
          tags: hit.tags || '',
        })
      }
      return videos
    } catch (e) {
      console.log('fetchVideoPool error:', e)
      await new Promise(r => setTimeout(r, 500 * (retry + 1)))
    }
  }

  return []
}

export async function GET(request: NextRequest) {
  const clientId = getClientIp(request)
  if (!(await checkRateLimit(`pixabay:${clientId}`, 30, 60_000))) {
    return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
  }

  const categoryParam = request.nextUrl.searchParams.get('category') || 'bird'

  const pool = await getCachedPool<PixabayVideo[]>(`pixabay:${categoryParam}`, () => fetchVideoPool(categoryParam))
  const video = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null
  if (!video) {
    return NextResponse.json({ error: true })
  }

  return NextResponse.json(video)
}
