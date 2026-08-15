import { NextRequest, NextResponse } from 'next/server'
import { searchCommonsFiles, fetchCommonsImageInfo, getWikimediaTopicSearches, type CommonsImage } from '@/lib/wikimedia-commons'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/ip'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'

export async function GET(request: NextRequest) {
  const clientId = getClientIp(request)
  if (!(await checkRateLimit(`wikimedia:${clientId}`, 30, 60_000))) {
    return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
  }

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

async function fetchRandomImage(topic?: string): Promise<CommonsImage | null> {
  const searches = await getWikimediaTopicSearches()
  const searchTerms = topic && searches[topic] ? [...searches[topic]] : ['France']

  searchTerms.sort(() => Math.random() - 0.5)

  for (const term of searchTerms) {
    const files = await searchCommonsFiles(term)
    if (files.length === 0) continue

    const shuffledFiles = [...files].sort(() => Math.random() - 0.5)
    const maxAttempts = Math.min(shuffledFiles.length, 5)

    for (let i = 0; i < maxAttempts; i++) {
      const randomFile = shuffledFiles[i]
      const image = await fetchCommonsImageInfo(randomFile)
      if (image && image.imageUrl) {
        return image
      }
    }
  }

  return null
}
