import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface SearchCacheEntry {
  ideas: any[]
  sources: any[]
  topics: any[]
  expiresAt: number
}

const searchCache = new Map<string, SearchCacheEntry>()
const SEARCH_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCachedSearch(q: string) {
  const cached = searchCache.get(q)
  if (cached && cached.expiresAt > Date.now()) {
    return cached
  }
  if (cached) {
    searchCache.delete(q)
  }
  return null
}

function setCachedSearch(q: string, ideas: any[], sources: any[], topics: any[]) {
  searchCache.set(q, {
    ideas,
    sources,
    topics,
    expiresAt: Date.now() + SEARCH_CACHE_TTL,
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let q = searchParams.get('q')?.trim() || ''

    if (!q || q.length < 2) {
      return NextResponse.json({ ideas: [], sources: [], topics: [] })
    }

    // Limit query length
    if (q.length > 100) {
      q = q.substring(0, 100)
    }

    // Check cache
    const cached = getCachedSearch(q)
    if (cached) {
      return NextResponse.json({ ideas: cached.ideas, sources: cached.sources, topics: cached.topics })
    }

    const [ideas, sources, topics] = await Promise.all([
      prisma.idea.findMany({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: q } },
            { content: { contains: q } },
            { takeaway: { contains: q } },
          ],
        },
        select: {
          id: true,
          title: true,
          content: true,
          takeaway: true,
          slug: true,
          saviezVous: true,
          ideaTopics: {
            select: {
              topic: { select: { name: true, slug: true, icon: true, color: true, id: true } },
            },
          },
          source: { select: { title: true, type: true, url: true, coverUrl: true } },
        },
        take: 20,
      }),
      prisma.source.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
          ],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          coverUrl: true,
        },
        take: 10,
      }),
      prisma.topic.findMany({
        where: {
          name: { contains: q },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          color: true,
        },
        take: 10,
      }),
    ])

    const formattedIdeas = ideas.map(idea => ({
      ...idea,
      topics: idea.ideaTopics.map(it => it.topic),
    }))

    // Cache results
    setCachedSearch(q, formattedIdeas, sources, topics)

    return NextResponse.json({ ideas: formattedIdeas, sources, topics })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ ideas: [], sources: [], topics: [] })
  }
}
