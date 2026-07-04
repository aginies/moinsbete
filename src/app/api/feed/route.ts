import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { DEFAULT_FEED_LIMIT } from '@/lib/constants'
import { getAllDescendantTopicIds, getAllDescendantCollectionTopicIds } from '@/lib/feed-helpers'

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
    const { searchParams } = new URL(request.url)
    const topic = searchParams.get('topic')
    const collection = searchParams.get('collection')
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || String(DEFAULT_FEED_LIMIT)), 50)

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

    const [ideas, total] = await Promise.all([
      prisma.idea.findMany({
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
        take: limit,
      }),
      prisma.idea.count({ where }),
    ])

    const uniqueIdeas = new Map<string, typeof ideas[number]>()
    for (const idea of ideas) {
      if (!uniqueIdeas.has(idea.id)) {
        uniqueIdeas.set(idea.id, idea)
      }
    }

    const formattedIdeas = Array.from(uniqueIdeas.values()).map(idea => ({
      ...idea,
      topics: idea.ideaTopics.map(it => it.topic),
    }))

    return NextResponse.json({
      ideas: formattedIdeas,
      hasMore: skip + ideas.length < total,
      total,
      page,
    })
  } catch (error) {
    console.error('Feed error:', error)
    return NextResponse.json({ ideas: [], hasMore: false, total: 0, page: 1 })
  }
}
