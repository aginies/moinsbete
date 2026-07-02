import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const topic = searchParams.get('topic')
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    let where: any = { isPublished: true }

    if (userId) {
      where.viewedIdeas = { none: { userId } }
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
              in: [topicRecord.id, ...topicRecord.children.map(c => c.id)],
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
