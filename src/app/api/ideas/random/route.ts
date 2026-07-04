import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const total = await prisma.idea.count({ where: { isPublished: true } })
    if (total === 0) {
      return NextResponse.json({ idea: null })
    }

    const randomOffset = Math.floor(Math.random() * total)
    const idea = await prisma.idea.findMany({
      where: { isPublished: true },
      skip: randomOffset,
      take: 1,
      include: {
        source: { select: { title: true, type: true, url: true, coverUrl: true } },
        ideaTopics: {
          include: {
            topic: { select: { id: true, name: true, slug: true, icon: true, color: true } },
          },
        },
      },
    })

    if (!idea || idea.length === 0) {
      return NextResponse.json({ idea: null })
    }

    const first = idea[0]

    return NextResponse.json({
      idea: {
        id: first.id,
        title: first.title,
        content: first.content,
        takeaway: first.takeaway,
        slug: first.slug,
        source: first.source,
        topics: first.ideaTopics.map(it => it.topic),
      },
    })
  } catch (error) {
    console.error('[RandomAPI] error:', error)
    return NextResponse.json({ idea: null })
  }
}
