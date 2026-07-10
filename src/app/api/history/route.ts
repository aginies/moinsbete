import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/ip'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'
import { mapIdeaWithTopics } from '@/lib/feed-helpers'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const userId = session.user.id

  const clientId = getClientIp(request)
  if (!(await checkRateLimit(`history:${userId}`, 60, 60_000))) {
    return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
  }
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const skip = (page - 1) * limit

  try {
    const [viewedIdeas, total] = await Promise.all([
      prisma.viewedIdea.findMany({
        where: { userId },
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
      prisma.viewedIdea.count({ where: { userId } }),
    ])

    const ideas = viewedIdeas.map(v => ({
      ...v.idea,
      viewedAt: v.viewedAt,
      topics: mapIdeaWithTopics(v.idea),
      id: v.idea.id,
    }))

    return NextResponse.json({
      ideas,
      hasMore: skip + ideas.length < total,
      total,
      page,
    })
  } catch (error) {
    console.error('History error:', error)
    return NextResponse.json({ ideas: [], hasMore: false, total: 0, page: 1 })
  }
}
