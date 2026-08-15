import { NextRequest, NextResponse } from 'next/server'
import { getWikimediaTopicSearches } from '@/lib/wikimedia-commons'
import { findRandomCommonsImage } from '@/lib/commons-random-image'
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

  const searches = await getWikimediaTopicSearches()
  const searchTerms = topic && searches[topic] ? searches[topic] : ['France']

  const image = await findRandomCommonsImage(searchTerms)
  if (!image) {
    return NextResponse.json({ error: true })
  }
  return NextResponse.json(image)
}
