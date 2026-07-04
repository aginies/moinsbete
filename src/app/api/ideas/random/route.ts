import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const total = await prisma.idea.count({ where: { isPublished: true } })
    if (total === 0) {
      return NextResponse.json({ idea: null })
    }

    const randomOffset = Math.floor(Math.random() * total)
    const ideas = await prisma.idea.findMany({
      where: { isPublished: true },
      select: { id: true },
      orderBy: { id: 'asc' },
      skip: randomOffset,
      take: 1,
    })

    if (!ideas.length) {
      return NextResponse.json({ idea: null })
    }

    const idea = await prisma.idea.findUnique({
      where: { id: ideas[0].id },
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
