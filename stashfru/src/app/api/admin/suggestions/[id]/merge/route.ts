import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const { id } = await params
    const { mergedIntoId } = await request.json()

    if (!mergedIntoId) {
      return NextResponse.json(
        { error: 'mergedIntoId is required' },
        { status: 400 }
      )
    }

    const targetTopic = await prisma.topic.findUnique({
      where: { id: mergedIntoId },
    })

    if (!targetTopic) {
      return NextResponse.json(
        { error: 'Target topic not found' },
        { status: 404 }
      )
    }

    await prisma.topicSuggestion.update({
      where: { id },
      data: {
        status: 'MERGED',
        mergedIntoId,
      },
    })

    return NextResponse.json({ success: true, mergedInto: targetTopic })
  } catch (error) {
    console.error('Merge suggestion error:', error)
    return NextResponse.json({ error: 'Failed to merge suggestion' }, { status: 500 })
  }
}
