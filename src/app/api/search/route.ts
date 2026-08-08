import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/ip'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'
import { mapIdeaWithTopics } from '@/lib/feed-helpers'
import { normalizeAccents } from '@/lib/utils'
import { createRedisTtlCache } from '@/lib/redis-cache'
import type { JsonValue } from '@prisma/client/runtime/library'

interface SearchCacheEntry {
  ideas: JsonValue[]
  sources: JsonValue[]
  topics: JsonValue[]
  facts: JsonValue[]
  proverbs: JsonValue[]
  images: JsonValue[]
  news: JsonValue[]
  citations: JsonValue[]
  portailWikipedia: JsonValue[]
  insolite: JsonValue[]
  expiresAt: number
}

const searchCache = createRedisTtlCache<SearchCacheEntry>({ ttlMs: 5 * 60 * 1000 })
const SEARCH_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Module-level cache for parsed proverbes to avoid repeated JSON.parse + DB query
let proverbesParseCache: { data: Array<{ text: string; signification: string; source: string }>; expiresAt: number } | null = null
const PROVERBES_PARSE_TTL = 5 * 60 * 1000 // 5 minutes

async function getCachedSearch(q: string) {
  const normalized = normalizeAccents(q).toLowerCase()
  const cached = await searchCache.get(normalized)
  if (cached && cached.expiresAt > Date.now()) {
    return cached
  }
  if (cached) {
    await searchCache.del(normalized)
  }
  return null
}

async function setCachedSearch(q: string, ideas: JsonValue[], sources: JsonValue[], topics: JsonValue[], facts: JsonValue[], proverbs: JsonValue[], images: JsonValue[], news: JsonValue[], citations: JsonValue[], portailWikipedia: JsonValue[], insolite: JsonValue[]) {
  await searchCache.set(q, {
    ideas,
    sources,
    topics,
    facts,
    proverbs,
    images,
    news,
    citations,
    portailWikipedia,
    insolite,
    expiresAt: Date.now() + SEARCH_CACHE_TTL,
  })
}

async function searchProverbesInCache(q: string) {
  const now = Date.now()
  let proverbs: Array<{ text: string; signification: string; source: string }> = []

  if (proverbesParseCache && proverbesParseCache.expiresAt > now) {
    proverbs = proverbesParseCache.data
  } else {
    try {
      const cached = await prisma.cachedConfig.findUnique({
        where: { key: 'proverbes_all' },
      })
      if (!cached) {
        proverbesParseCache = { data: [], expiresAt: now + PROVERBES_PARSE_TTL }
        return []
      }
      proverbs = JSON.parse(cached.value) as Array<{ text: string; signification: string; source: string }>
      proverbesParseCache = { data: proverbs, expiresAt: now + PROVERBES_PARSE_TTL }
    } catch {
      proverbesParseCache = { data: [], expiresAt: now + PROVERBES_PARSE_TTL }
      return []
    }
  }

  const normalized = normalizeAccents(q).toLowerCase()
  return proverbs
    .filter(p =>
      normalizeAccents(p.text).toLowerCase().includes(normalized) ||
      normalizeAccents(p.signification).toLowerCase().includes(normalized)
    )
    .slice(0, 5)
    .map(p => ({ id: p.text.toLowerCase().replace(/\s+/g, '_'), text: p.text, signification: p.signification, source: p.source }))
}

async function searchImagesInCache(q: string) {
  try {
    const images = await prisma.cachedWikipediaImage.findMany({
      where: {
        description: { contains: q },
      },
      select: {
        id: true,
        imageUrl: true,
        description: true,
        fileUrl: true,
        date: true,
      },
      take: 5,
    })
    return images
  } catch {
    return []
  }
}

async function searchNews(q: string) {
  try {
    const news = await prisma.cachedNewsArticle.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        imageUrl: true,
      },
      take: 5,
    })
    return news
  } catch {
    return []
  }
}

async function searchCitations(q: string) {
  try {
    const citations = await prisma.cachedCitationArticle.findMany({
      where: {
        OR: [
          { text: { contains: q } },
          { author: { contains: q } },
        ],
      },
      select: {
        id: true,
        text: true,
        author: true,
        wikiUrl: true,
      },
      take: 5,
    })
    return citations
  } catch {
    return []
  }
}

async function searchPortailWikipedia(q: string) {
  try {
    const articles = await prisma.cachedWikipediaPortalArticle.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { extract: { contains: q } },
        ],
      },
      select: {
        id: true,
        title: true,
        extract: true,
        pageUrl: true,
        imageUrl: true,
      },
      take: 5,
    })
    return articles
  } catch {
    return []
  }
}

async function searchInsolite(q: string) {
  try {
    const articles = await prisma.cachedInsoliteArticle.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        imageUrl: true,
      },
      take: 5,
    })
    return articles
  } catch {
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let q = searchParams.get('q')?.trim() || ''

    if (!q || q.length < 2) {
      return NextResponse.json({ ideas: [], sources: [], topics: [], facts: [], proverbs: [], images: [], news: [], citations: [], portailWikipedia: [], insolite: [] })
    }

    if (q.length > 100) {
      q = q.substring(0, 100)
    }

    const clientId = getClientIp(request)
    if (!(await checkRateLimit(`search:${clientId}`, 30, 60_000))) {
      return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
    }

    // Check cache
    const cached = await getCachedSearch(q)
    if (cached) {
      return NextResponse.json({ ideas: cached.ideas, sources: cached.sources, topics: cached.topics, facts: cached.facts, proverbs: cached.proverbs, images: cached.images, news: cached.news, citations: cached.citations, portailWikipedia: cached.portailWikipedia, insolite: cached.insolite })
    }

    const normalizedQ = normalizeAccents(q).toLowerCase()
    const [ideas, sources, topics, facts, proverbs, images, news, citations, portailWikipedia, insolite] = await Promise.all([
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
        take: 5,
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
        take: 5,
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
        take: 5,
      }),
      prisma.saviezVousFact.findMany({
        where: {
          text: { contains: q },
        },
        select: {
          id: true,
          text: true,
        },
        take: 5,
      }),
      searchProverbesInCache(q),
      searchImagesInCache(q),
      searchNews(q),
      searchCitations(q),
      searchPortailWikipedia(q),
      searchInsolite(q),
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

    await setCachedSearch(normalizedQ, formattedIdeas as any, filteredSources as any, filteredTopics as any, filteredFacts as any, proverbs as any, images as any, news as any, citations as any, portailWikipedia as any, insolite as any)

    return NextResponse.json({ ideas: formattedIdeas, sources: filteredSources, topics: filteredTopics, facts: filteredFacts, proverbs, images, news, citations, portailWikipedia, insolite })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ ideas: [], sources: [], topics: [], facts: [], proverbs: [], images: [], news: [], citations: [], portailWikipedia: [], insolite: [] })
  }
}
