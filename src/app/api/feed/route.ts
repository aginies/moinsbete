import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { DEFAULT_FEED_LIMIT } from '@/lib/constants'

interface TopicChild {
  id: string
}

interface TopicWithChildren {
  id: string
  children: TopicChild[]
}

interface IdeaTopic {
  topic: {
    id: string
    name: string
    slug: string
    icon: string
    color: string
  }
}

interface Idea {
  id: string
  title: string
  content: string
  takeaway: string
  slug: string
  saviezVous: string | null
  source: {
    title: string
    type: string
    url: string | null
    coverUrl: string | null
  }
  ideaTopics: IdeaTopic[]
}

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

const topicCache = new Map<string, { children: string[]; expiresAt: number }>()
const COLLECTION_CACHE_TTL = 5 * 60 * 1000

function getTopicChildren(topicId: string): string[] | null {
  const cached = topicCache.get(topicId)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.children
  }
  return null
}

function setTopicChildren(topicId: string, children: string[]) {
  topicCache.set(topicId, {
    children,
    expiresAt: Date.now() + COLLECTION_CACHE_TTL,
  })
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
      let topicChildren = getTopicChildren(topic)
      if (!topicChildren) {
        const topicRecord = await prisma.topic.findUnique({
          where: { slug: topic },
          select: { id: true, children: { select: { id: true } } },
        })

        if (topicRecord) {
          topicChildren = [topicRecord.id, ...topicRecord.children.map((c: TopicChild) => c.id)]
          setTopicChildren(topic, topicChildren)
        }
      }

      if (topicChildren) {
        where.ideaTopics = {
          some: {
            topicId: {
              in: topicChildren,
            },
          },
        }
      }
    }

    if (collection) {
      let collectionTopicIds: string[] | null = null
      const cached = topicCache.get(`collection:${collection}`)
      if (cached && cached.expiresAt > Date.now()) {
        collectionTopicIds = cached.children
      }

      if (!collectionTopicIds) {
        const collectionRecord = await prisma.collection.findUnique({
          where: { slug: collection },
          select: { topics: { select: { id: true, children: { select: { id: true } } } } },
        })

        if (collectionRecord) {
          collectionTopicIds = collectionRecord.topics.flatMap((t: { id: string; children: { id: string }[] }) => [t.id, ...t.children.map((c: { id: string }) => c.id)])
          setTopicChildren(`collection:${collection}`, collectionTopicIds)
        }
      }

      if (collectionTopicIds) {
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
        orderBy: { orderIndex: 'asc' },
        skip,
        take: limit,
      }),
      prisma.idea.count({ where }),
    ])

    const formattedMap = new Map()
    const seenTitles = new Set()
    for (const idea of ideas) {
      if (seenTitles.has(idea.title)) continue
      seenTitles.add(idea.title)
      if (!formattedMap.has(idea.id)) {
        formattedMap.set(idea.id, {
          ...idea,
          topics: idea.ideaTopics.map(it => it.topic),
          saviezVous: idea.saviezVous,
        })
      }
    }
    const formattedIdeas = Array.from(formattedMap.values())

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
