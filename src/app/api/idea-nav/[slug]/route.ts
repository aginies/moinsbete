import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface TopicWithChildren {
  id: string
  children: Array<{ id: string }>
}

interface CollectionWithTopics {
  id: string
  topics: Array<{
    id: string
    children: Array<{ id: string }>
  }>
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const topic = searchParams.get('topic')
    const collection = searchParams.get('collection')

    const currentIdea = await prisma.idea.findUnique({
      where: { slug },
      select: { orderIndex: true },
    })

    if (!currentIdea) {
      return NextResponse.json({ prev: null, next: null })
    }

    const where: { isPublished: boolean; orderIndex: { not: number }; ideaTopics?: { some: { topicId: { in: string[] } } } } = {
      isPublished: true,
      orderIndex: { not: currentIdea.orderIndex },
    }

    if (topic) {
      const topicRecord = await prisma.topic.findUnique({
        where: { slug: topic },
        select: { id: true, children: { select: { id: true } } },
      })

      if (topicRecord) {
        where.ideaTopics = {
          some: {
            topicId: {
              in: [topicRecord.id, ...topicRecord.children.map((c) => c.id)],
            },
          },
        }
      }
    }

    if (collection) {
      const collectionRecord = await prisma.collection.findUnique({
        where: { slug: collection },
        select: { topics: { select: { id: true, children: { select: { id: true } } } } },
      })

      if (collectionRecord) {
        const topicIds = collectionRecord.topics.flatMap((t) => [t.id, ...t.children.map((c) => c.id)])
        where.ideaTopics = {
          some: {
            topicId: {
              in: topicIds,
            },
          },
        }
      }
    }

    const [prev, next] = await Promise.all([
      prisma.idea.findFirst({
        where: { ...where, orderIndex: { lt: currentIdea.orderIndex } },
        orderBy: { orderIndex: 'desc' },
        select: { slug: true, title: true },
      }),
      prisma.idea.findFirst({
        where: { ...where, orderIndex: { gt: currentIdea.orderIndex } },
        orderBy: { orderIndex: 'asc' },
        select: { slug: true, title: true },
      }),
    ])

    return NextResponse.json({ prev, next })
  } catch (error) {
    console.error('Idea nav error:', error)
    return NextResponse.json({ prev: null, next: null })
  }
}
