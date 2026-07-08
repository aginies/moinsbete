import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limiter'

interface SearchCacheEntry {
  ideas: any[]
  sources: any[]
  topics: any[]
  expiresAt: number
}

const searchCache = new Map<string, SearchCacheEntry>()
const SEARCH_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function normalizeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function getCachedSearch(q: string) {
  const normalized = normalizeAccents(q).toLowerCase()
  const cached = searchCache.get(normalized)
  if (cached && cached.expiresAt > Date.now()) {
    return cached
  }
  if (cached) {
    searchCache.delete(normalized)
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

    if (q.length > 100) {
      q = q.substring(0, 100)
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const clientId = ip.split(',')[0].trim()
    if (!checkRateLimit(`search:${clientId}`, 30, 60_000)) {
      return NextResponse.json({ error: 'Trop de demandes. Réessayez dans 60 secondes.' }, { status: 429 })
    }

    // Check cache
    const cached = getCachedSearch(q)
    if (cached) {
      return NextResponse.json({ ideas: cached.ideas, sources: cached.sources, topics: cached.topics })
    }

    const normalizedQ = normalizeAccents(q).toLowerCase()
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
           description: true,
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

    const filteredIdeas = ideas.filter(idea =>
      normalizeAccents(idea.title).toLowerCase().includes(normalizedQ) ||
      normalizeAccents(idea.content).toLowerCase().includes(normalizedQ) ||
      normalizeAccents(idea.takeaway || '').toLowerCase().includes(normalizedQ)
    )

    const filteredSources = sources.filter(source =>
      normalizeAccents(source.title).toLowerCase().includes(normalizedQ) ||
      normalizeAccents(source.description || '').toLowerCase().includes(normalizedQ)
    )

    const filteredTopics = topics.filter(topic =>
      normalizeAccents(topic.name).toLowerCase().includes(normalizedQ)
    )

    const formattedIdeas = filteredIdeas.map(idea => ({
      ...idea,
      topics: idea.ideaTopics.map(it => it.topic),
    }))

    // Cache results
    setCachedSearch(normalizedQ, formattedIdeas, filteredSources, filteredTopics)

    return NextResponse.json({ ideas: formattedIdeas, sources, topics })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ ideas: [], sources: [], topics: [] })
  }
}
