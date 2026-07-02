import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { slugify, getRandomIcon, getRandomColor } from '@/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const suggestion = await prisma.topicSuggestion.findUnique({
      where: { id },
    })

    if (!suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 })
    }

    if (suggestion.status !== 'PENDING') {
      return NextResponse.json({ error: 'Suggestion already processed' }, { status: 400 })
    }

    let topic

    if (suggestion.parentId) {
      topic = await prisma.topic.create({
        data: {
          name: suggestion.categoryName,
          slug: slugify(suggestion.categoryName),
          icon: suggestion.icon,
          color: getRandomColor(),
          parentId: suggestion.parentId,
        },
      })
    } else {
      topic = await prisma.topic.create({
        data: {
          name: suggestion.categoryName,
          slug: slugify(suggestion.categoryName),
          icon: suggestion.icon,
          color: getRandomColor(),
        },
      })
    }

    await prisma.topicSuggestion.update({
      where: { id },
      data: {
        status: 'APPROVED',
        mergedIntoId: topic.id,
      },
    })

    return NextResponse.json({ success: true, topic })
  } catch (error) {
    console.error('Approve suggestion error:', error)
    return NextResponse.json({ error: 'Failed to approve suggestion' }, { status: 500 })
  }
}
