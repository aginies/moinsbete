import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'
import { mapIdeaWithTopics } from '@/lib/feed-helpers'
import { normalizeAccents } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const userId = session.user.id

  if (!(await checkRateLimit(`history:${userId}`, 60, 60_000))) {
    return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
  }
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const skip = (page - 1) * limit
  const q = searchParams.get('q')?.trim()

  try {
    const titleFilter = q ? { contains: q } : undefined
    const [viewedIdeas, total] = await Promise.all([
      prisma.viewedIdea.findMany({
        where: q
          ? { userId, idea: { title: titleFilter } }
          : { userId },
        include: {
          idea: {
            include: {
              source: { select: { title: true, type: true, url: true, coverUrl: true } },
              ideaTopics: {
                include: {
                  topic: { select: { id: true, name: true, slug: true, icon: true, color: true } },
                },
              },
            },
          },
        },
        orderBy: { viewedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.viewedIdea.count({
        where: q
          ? { userId, idea: { title: titleFilter } }
          : { userId },
      }),
    ])

    const normalizedQ = q ? normalizeAccents(q).toLowerCase() : null
    const ideas = viewedIdeas.map(v => ({
      ...v.idea,
      viewedAt: v.viewedAt,
      topics: mapIdeaWithTopics(v.idea),
      id: v.idea.id,
    }))

    if (normalizedQ) {
      const filtered = ideas.filter(idea =>
        normalizeAccents(idea.title).toLowerCase().includes(normalizedQ)
      )
      ideas.length = 0
      ideas.push(...filtered)
    }

    return NextResponse.json({
      ideas,
      total,
      page,
    })
  } catch (error) {
    console.error('History error:', error)
    return NextResponse.json({ ideas: [], total: 0, page: 1 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { viewedIdeaId, userId } = await request.json()
  if (!viewedIdeaId || !userId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  try {
    await prisma.viewedIdea.deleteMany({
      where: { id: viewedIdeaId, userId },
    })
    const total = await prisma.viewedIdea.count({ where: { userId } })
    return NextResponse.json({ total })
  } catch (error) {
    console.error('Remove history error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
