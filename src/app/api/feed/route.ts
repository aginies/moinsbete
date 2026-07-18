import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { DEFAULT_FEED_LIMIT } from '@/lib/constants'
import { getAllDescendantTopicIds, getAllDescendantCollectionTopicIds, mapIdeaWithTopics } from '@/lib/feed-helpers'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'

interface WhereClause {
  isPublished: boolean
  viewedIdeas?: { none: { userId: string } }
  ideaTopics?: {
    some: {
      topicId: {
        in: string[]
      }
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const sessionUserId = session?.user?.id

    if (sessionUserId) {
      if (!(await checkRateLimit(`feed:${sessionUserId}`, 20, 60_000))) {
        return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
      }
    }

    const { searchParams } = new URL(request.url)
    const topic = searchParams.get('topic')
    const collection = searchParams.get('collection')
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || String(DEFAULT_FEED_LIMIT)), 50)

    if (userId && !/^[\w\-]+$/.test(userId)) {
      return NextResponse.json({ ideas: [], hasMore: false, total: 0, page: 1 })
    }

    const skip = (page - 1) * limit

    const where: WhereClause = { isPublished: true }

    if (userId) {
      where.viewedIdeas = { none: { userId } }
    }

    if (topic) {
      const topicIds = await getAllDescendantTopicIds(topic)
      if (topicIds.length > 0) {
        where.ideaTopics = {
          some: {
            topicId: {
              in: topicIds,
            },
          },
        }
      }
    }

    if (collection) {
      const collectionTopicIds = await getAllDescendantCollectionTopicIds(collection)
      if (collectionTopicIds.length > 0) {
        where.ideaTopics = {
          some: {
            topicId: {
              in: collectionTopicIds,
            },
          },
        }
      }
    }

    const ideas = await prisma.idea.findMany({
      where,
      include: {
        source: { select: { title: true, type: true, url: true, coverUrl: true } },
        ideaTopics: {
          include: {
            topic: { select: { id: true, name: true, slug: true, icon: true, color: true } },
          },
        },
      },
      orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
      skip,
      take: limit + 1,
    })

    const hasMore = ideas.length > limit
    const returnedIdeas = hasMore ? ideas.slice(0, limit) : ideas

    const uniqueIdeas = new Map<string, typeof ideas[number]>()
    for (const idea of returnedIdeas) {
      if (!uniqueIdeas.has(idea.id)) {
        uniqueIdeas.set(idea.id, idea)
      }
    }

    const formattedIdeas = Array.from(uniqueIdeas.values()).map(idea => ({
      ...idea,
      topics: mapIdeaWithTopics(idea),
    }))

    return NextResponse.json({
      ideas: formattedIdeas,
      hasMore,
      total: 0,
      page,
    })
  } catch (error) {
    console.error('Feed error:', error)
    return NextResponse.json({ ideas: [], hasMore: false, total: 0, page: 1 })
  }
}
