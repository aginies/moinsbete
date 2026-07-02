import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    const skip = (page - 1) * limit

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
      topics: v.idea.ideaTopics.map(it => it.topic),
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
