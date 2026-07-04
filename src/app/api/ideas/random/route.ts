import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const total = await prisma.idea.count({ where: { isPublished: true } })
    if (total === 0) {
      return NextResponse.json({ idea: null })
    }

    // Use indexed approach instead of offset for better performance
    const randomSeed = Math.floor(Math.random() * total)
    
    // Find a seed idea using index
    const seedIdea = await prisma.idea.findFirst({
      where: { isPublished: true },
      select: { id: true },
      orderBy: { id: 'asc' },
      skip: randomSeed,
      take: 1,
    })

    if (!seedIdea) {
      return NextResponse.json({ idea: null })
    }

    // Find next idea after seed (uses index)
    const nextIdea = await prisma.idea.findFirst({
      where: { isPublished: true, id: { gt: seedIdea.id } },
      select: { id: true },
      orderBy: { id: 'asc' },
    })

    // Wrap around to beginning if we reached the end
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
