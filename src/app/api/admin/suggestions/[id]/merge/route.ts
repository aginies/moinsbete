import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionWithCookies } from '@/lib/auth'
import { isCsrfValid } from '@/lib/csrf'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isCsrfValid(request)) {
    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
  }

  const session = await getSessionWithCookies(await cookies())
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
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
