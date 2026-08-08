import { NextRequest, NextResponse } from 'next/server'
import { searchCommonsFiles, fetchCommonsImageInfo, getWikimediaTopicSearches, type CommonsImage } from '@/lib/wikimedia-commons'

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
