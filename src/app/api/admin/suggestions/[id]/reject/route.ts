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

    await prisma.topicSuggestion.update({
      where: { id },
      data: { status: 'REJECTED' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reject suggestion error:', error)
    return NextResponse.json({ error: 'Failed to reject suggestion' }, { status: 500 })
  }
}
