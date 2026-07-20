import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { mapIdeaWithTopics } from '@/lib/feed-helpers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId')
    const followed = searchParams.get('followed')

    if (userId && !/^[\w\-]+$/.test(userId)) {
      return NextResponse.json({ idea: null }, { status: 400 })
    }

    const whereClause: Record<string, any> = { isPublished: true }

    if (userId && followed === '1') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { following: { select: { id: true } } },
      })

      if (user && user.following.length > 0) {
        const topicIds = user.following.map((t: { id: string }) => t.id)
        whereClause.ideaTopics = { some: { topicId: { in: topicIds } } }
      }
    }

    const total = await prisma.idea.count({ where: whereClause })
    if (total === 0) {
      return NextResponse.json({ idea: null })
    }

    const randomSeed = Math.floor(Math.random() * total)
    
    const seedIdea = await prisma.idea.findFirst({
      where: whereClause,
      select: { id: true },
      orderBy: { id: 'asc' },
      skip: randomSeed,
      take: 1,
    })

    if (!seedIdea) {
      return NextResponse.json({ idea: null })
    }

    const nextIdea = await prisma.idea.findFirst({
      where: { ...whereClause, id: { gt: seedIdea.id } },
      select: { id: true },
      orderBy: { id: 'asc' },
    })

    const finalId = nextIdea?.id ?? seedIdea.id
    
    const idea = await prisma.idea.findUnique({
      where: { id: finalId },
      include: {
        source: { select: { title: true, type: true, url: true, coverUrl: true } },
        ideaTopics: {
          include: {
            topic: { select: { id: true, name: true, slug: true, icon: true, color: true } },
          },
        },
      },
    })

    if (!idea) {
      return NextResponse.json({ idea: null })
    }

    return NextResponse.json({
      idea: {
        id: idea.id,
        title: idea.title,
        content: idea.content,
        takeaway: idea.takeaway,
        slug: idea.slug,
        source: idea.source,
        topics: mapIdeaWithTopics(idea),
      },
    })
  } catch (error) {
    console.error('[RandomAPI] error:', error)
    return NextResponse.json({ idea: null })
  }
}
