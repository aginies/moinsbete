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

async function fetchRandomVideo(category: string): Promise<PixabayVideo | null> {
  if (!API_KEY) {
    return null
  }

  const randomPage = Math.floor(Math.random() * 10) + 1
  const params = new URLSearchParams({
    key: API_KEY,
    q: category,
    order: 'popular',
    per_page: '200',
    page: String(randomPage),
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

      if (hits.length === 0) {
        const randomPage2 = Math.floor(Math.random() * 10) + 1
        const params2 = new URLSearchParams({
          key: API_KEY,
          q: category,
          order: 'popular',
          per_page: '200',
          page: String(randomPage2),
        })
        const res2 = await fetch(`${PIXABAY_API}?${params2}`, {
          signal: AbortSignal.timeout(15000),
        })
        if (res2.ok) {
          const data2 = await res2.json()
          const hits2 = data2.hits || []
          if (hits2.length === 0) return null
          const randomVideo2 = hits2[Math.floor(Math.random() * hits2.length)]
          const mediumVideo2 = randomVideo2.videos?.medium || randomVideo2.videos?.small
          if (!mediumVideo2?.url) return null
          return {
            id: randomVideo2.id,
            pageURL: randomVideo2.pageURL,
            author: randomVideo2.user || '',
            authorProfileUrl: `https://pixabay.com/users/${randomVideo2.user}-${randomVideo2.user_id}/`,
            duration: randomVideo2.duration || 0,
            thumbnailUrl: mediumVideo2.thumbnail || '',
            videoUrl: `/api/video-proxy?url=${encodeURIComponent(mediumVideo2.url)}`,
            tags: randomVideo2.tags || '',
          }
        }
        return null
      }

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
        videoUrl: `/api/video-proxy?url=${encodeURIComponent(mediumVideo.url)}`,
        tags: randomVideo.tags || '',
      }
    } catch (e) {
      console.log('fetchRandomVideo error:', e)
      await new Promise(r => setTimeout(r, 500 * (retry + 1)))
    }
  }

  return null
}

export async function GET(request: NextRequest) {
  const categoryParam = request.nextUrl.searchParams.get('category') || 'nature'

  const video = await fetchRandomVideo(categoryParam)
  console.log('API returning video:', video?.videoUrl)
  if (!video) {
    return NextResponse.json({ error: true })
  }

  return NextResponse.json(video)
}
