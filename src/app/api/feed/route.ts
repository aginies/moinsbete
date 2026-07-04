import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { DEFAULT_FEED_LIMIT } from '@/lib/constants'

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
        orderBy: { orderIndex: 'asc' },
        skip,
        take: limit,
      }),
      prisma.idea.count({ where }),
    ])

    const formattedIdeas = ideas.map(idea => ({
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

async function getAllDescendantTopicIds(topicSlug: string): Promise<string[]> {
  const cached = topicCache.get(topicSlug)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.children
  }

  const topicRecord = await prisma.topic.findUnique({
    where: { slug: topicSlug },
    select: { id: true, children: { select: { id: true } } },
  })

  if (!topicRecord) return []

  const allIds: string[] = [topicRecord.id]
  const queue = topicRecord.children.map((c: { id: string }) => c.id)

  while (queue.length > 0) {
    const currentId = queue.shift()!
    allIds.push(currentId)
    const children = await prisma.topic.findMany({
      where: { parentId: currentId },
      select: { id: true },
    })
    queue.push(...children.map((c: { id: string }) => c.id))
  }

  setTopicChildren(topicSlug, allIds)
  return allIds
}

async function getAllDescendantCollectionTopicIds(collectionSlug: string): Promise<string[]> {
  const cachedKey = `collection:${collectionSlug}`
  const cached = topicCache.get(cachedKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.children
  }

  const collectionRecord = await prisma.collection.findUnique({
    where: { slug: collectionSlug },
    select: { topics: { select: { id: true, children: { select: { id: true } } } } },
  })

  if (!collectionRecord) return []

  const allIds: string[] = []
  const queue = collectionRecord.topics.map((t: { id: string }) => t.id)

  while (queue.length > 0) {
    const currentId = queue.shift()!
    allIds.push(currentId)
    const children = await prisma.topic.findMany({
      where: { parentId: currentId },
      select: { id: true },
    })
    queue.push(...children.map((c: { id: string }) => c.id))
  }

  setTopicChildren(cachedKey, allIds)
  return allIds
}
