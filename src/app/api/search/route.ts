import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''

    if (!q || q.length < 2) {
      return NextResponse.json({ ideas: [], sources: [], topics: [] })
    }

    const [ideas, sources, topics] = await Promise.all([
      prisma.idea.findMany({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: q } },
            { content: { contains: q } },
            { takeaway: { contains: q } },
          ],
        },
        include: {
          ideaTopics: {
            include: {
              topic: { select: { name: true, slug: true, icon: true } },
            },
          },
          source: { select: { title: true } },
        },
        take: 20,
      }),
      prisma.source.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
          ],
        },
        take: 10,
      }),
      prisma.topic.findMany({
        where: {
          name: { contains: q },
        },
        take: 10,
      }),
    ])

    const formattedIdeas = ideas.map(idea => ({
      ...idea,
      topics: idea.ideaTopics.map(it => it.topic),
    }))

    return NextResponse.json({ ideas: formattedIdeas, sources, topics })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ ideas: [], sources: [], topics: [] })
  }
}
