import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/ip'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

interface CitationItem {
  id: string
  text: string
  author: string
  source?: string
  category: string
  categoryType: 'theme' | 'auteur' | 'daily'
  wikiUrl: string
  imageUrl?: string
}

export async function GET(request: NextRequest) {
  try {
    const clientId = getClientIp(request)
    if (!(await checkRateLimit(`citation:${clientId}`, 30, 60_000))) {
      return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
    }

    const url = new URL(request.url)
    const categories = url.searchParams.get('categories')?.split(',').filter(Boolean)
    const categoryType = url.searchParams.get('type')
    const daily = url.searchParams.get('daily')

    const now = new Date()
    const where: any = { expiresAt: { gte: now } }

    if (daily === '1') {
      where.categoryType = 'daily'
    } else if (categoryType) {
      where.categoryType = categoryType
    }
    if (categories && categories.length > 0) {
      where.category = { in: categories }
    }

    const cached = await prisma.cachedCitationArticle.findMany({
      where,
      orderBy: { scrapedAt: 'desc' },
      take: 50,
    })

    const items: CitationItem[] = cached
      .sort(() => Math.random() - 0.5)
      .slice(0, daily === '1' ? 1 : 15)
      .map(c => ({
        id: c.id,
        text: c.text,
        author: c.author,
        source: c.source || undefined,
        category: c.category,
        categoryType: c.categoryType as 'theme' | 'auteur' | 'daily',
        wikiUrl: c.wikiUrl,
        imageUrl: c.imageUrl || undefined,
      }))

    // Fetch available categories for the card
    const allCategories = await prisma.cachedCitationArticle.findMany({
      where: { expiresAt: { gte: now } },
      select: { category: true, categoryType: true },
      distinct: ['category', 'categoryType'],
    })
    const categoriesMap: Record<string, string[]> = { theme: [], auteur: [], daily: [] }
    for (const c of allCategories) {
      if (!categoriesMap[c.categoryType]) categoriesMap[c.categoryType] = []
      if (!categoriesMap[c.categoryType].includes(c.category)) {
        categoriesMap[c.categoryType].push(c.category)
      }
    }

    // Bookmarked IDs
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    let bookmarkedIds: string[] = []

    if (userId && items.length > 0) {
      const bookmarks = await prisma.bookmark.findMany({
        where: {
          userId,
          type: 'CITATION',
          resourceId: { in: items.map(i => i.id) },
        },
        select: { resourceId: true },
      })
      bookmarkedIds = bookmarks.map(b => b.resourceId || '')
    }

    return NextResponse.json({
      citations: items,
      categories: categoriesMap,
      bookmarkedIds,
    })
  } catch (error) {
    console.error('Citation API error:', error)
    return NextResponse.json({
      citations: [],
      categories: { theme: [], auteur: [], daily: [] },
      bookmarkedIds: [],
    })
  }
}
