import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/ip'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'
import { mapIdeaWithTopics } from '@/lib/feed-helpers'
import { normalizeAccents } from '@/lib/utils'
import type { JsonValue } from '@prisma/client/runtime/library'

interface SearchCacheEntry {
  ideas: JsonValue[]
  sources: JsonValue[]
  topics: JsonValue[]
  facts: JsonValue[]
  expiresAt: number
}

const searchCache = new Map<string, SearchCacheEntry>()
const SEARCH_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

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

function setCachedSearch(q: string, ideas: JsonValue[], sources: JsonValue[], topics: JsonValue[], facts: JsonValue[]) {
  searchCache.set(q, {
    ideas,
    sources,
    topics,
    facts,
    expiresAt: Date.now() + SEARCH_CACHE_TTL,
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let q = searchParams.get('q')?.trim() || ''

    if (!q || q.length < 2) {
      return NextResponse.json({ ideas: [], sources: [], topics: [], facts: [] })
    }

    if (q.length > 100) {
      q = q.substring(0, 100)
    }

    const clientId = getClientIp(request)
    if (!(await checkRateLimit(`search:${clientId}`, 30, 60_000))) {
      return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
    }

    // Check cache
    const cached = getCachedSearch(q)
    if (cached) {
      return NextResponse.json({ ideas: cached.ideas, sources: cached.sources, topics: cached.topics, facts: cached.facts })
    }

    const normalizedQ = normalizeAccents(q).toLowerCase()
    const [ideas, sources, topics, facts] = await Promise.all([
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
      prisma.saviezVousFact.findMany({
        where: {
          text: { contains: q },
        },
        select: {
          id: true,
          text: true,
          createdAt: true,
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

    const filteredFacts = facts.filter(fact =>
      normalizeAccents(fact.text).toLowerCase().includes(normalizedQ)
    )

    const formattedIdeas = filteredIdeas.map(idea => ({
      ...idea,
      topics: mapIdeaWithTopics(idea),
    }))

    // Cache results
    setCachedSearch(normalizedQ, formattedIdeas as any, filteredSources as any, filteredTopics as any, filteredFacts as any)

    return NextResponse.json({ ideas: formattedIdeas, sources: filteredSources, topics: filteredTopics, facts: filteredFacts })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ ideas: [], sources: [], topics: [], facts: [] })
  }
}
