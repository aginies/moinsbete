import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId')
    const followed = searchParams.get('followed')

    if (userId && !/^[a-fA-F0-9\-]+$/.test(userId)) {
      return NextResponse.json({ idea: null }, { status: 400 })
    }

    let whereClause: any = { isPublished: true }

    if (userId && followed === '1') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { following: { select: { id: true } } },
      })

      console.log('[RandomAPI] userId:', userId, 'hasFollowing:', !!user, 'followingCount:', user?.following?.length)

      if (user && user.following.length > 0) {
        const topicIds = user.following.map((t: { id: string }) => t.id)
        whereClause.ideaTopics = { some: { topicId: { in: topicIds } } }
        console.log('[RandomAPI] topicIds:', topicIds)
      }
    }

    const total = await prisma.idea.count({ where: whereClause })
    console.log('[RandomAPI] whereClause:', JSON.stringify(whereClause), 'total:', total)
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
        topics: idea.ideaTopics.map(it => it.topic),
      },
    })
  } catch (error) {
    console.error('[RandomAPI] error:', error)
    return NextResponse.json({ idea: null })
  }
}
