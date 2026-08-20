import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/ip'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'
import { mapIdeaWithTopics } from '@/lib/feed-helpers'
import { normalizeAccents } from '@/lib/utils'
import { createRedisTtlCache } from '@/lib/redis-cache'

interface SearchCacheEntry {
  ideas: unknown[]
  sources: unknown[]
  topics: unknown[]
  facts: unknown[]
  proverbs: unknown[]
  images: unknown[]
  news: unknown[]
  citations: unknown[]
  portailWikipedia: unknown[]
  insolite: unknown[]
}

const searchCache = createRedisTtlCache<SearchCacheEntry>({ ttlMs: 5 * 60 * 1000 })

// Module-level cache for parsed proverbes to avoid repeated JSON.parse + DB query
let proverbesParseCache: { data: Array<{ text: string; signification: string; source: string }>; expiresAt: number } | null = null
const PROVERBES_PARSE_TTL = 5 * 60 * 1000 // 5 minutes

async function getCachedSearch(q: string) {
  const normalized = normalizeAccents(q).toLowerCase()
  return searchCache.get(normalized)
}

async function setCachedSearch(q: string, ideas: unknown[], sources: unknown[], topics: unknown[], facts: unknown[], proverbs: unknown[], images: unknown[], news: unknown[], citations: unknown[], portailWikipedia: unknown[], insolite: unknown[]) {
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

async function searchImagesInCache(q: string, normalizedQ: string) {
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
      take: 20,
    })
    return images
      .filter(img => normalizeAccents(img.description).toLowerCase().includes(normalizedQ))
      .slice(0, 5)
  } catch {
    return []
  }
}

async function searchNews(q: string, normalizedQ: string) {
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
      take: 20,
    })
    return news
      .filter(n =>
        normalizeAccents(n.title).toLowerCase().includes(normalizedQ) ||
        normalizeAccents(n.description || '').toLowerCase().includes(normalizedQ)
      )
      .slice(0, 5)
  } catch {
    return []
  }
}

async function searchCitations(q: string, normalizedQ: string) {
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
      take: 20,
    })
    return citations
      .filter(c =>
        normalizeAccents(c.text).toLowerCase().includes(normalizedQ) ||
        normalizeAccents(c.author || '').toLowerCase().includes(normalizedQ)
      )
      .slice(0, 5)
  } catch {
    return []
  }
}

async function searchPortailWikipedia(q: string, normalizedQ: string) {
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
      take: 20,
    })
    return articles
      .filter(a =>
        normalizeAccents(a.title).toLowerCase().includes(normalizedQ) ||
        normalizeAccents(a.extract || '').toLowerCase().includes(normalizedQ)
      )
      .slice(0, 5)
  } catch {
    return []
  }
}

async function searchInsolite(q: string, normalizedQ: string) {
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
      take: 20,
    })
    return articles
      .filter(a =>
        normalizeAccents(a.title).toLowerCase().includes(normalizedQ) ||
        normalizeAccents(a.description || '').toLowerCase().includes(normalizedQ)
      )
      .slice(0, 5)
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
      searchImagesInCache(q, normalizedQ),
      searchNews(q, normalizedQ),
      searchCitations(q, normalizedQ),
      searchPortailWikipedia(q, normalizedQ),
      searchInsolite(q, normalizedQ),
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

    await setCachedSearch(normalizedQ, formattedIdeas, filteredSources, filteredTopics, filteredFacts, proverbs, images, news, citations, portailWikipedia, insolite)

    return NextResponse.json({ ideas: formattedIdeas, sources: filteredSources, topics: filteredTopics, facts: filteredFacts, proverbs, images, news, citations, portailWikipedia, insolite })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
