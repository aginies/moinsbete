import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { NextRequest } from 'next/server'

function isCsrfValid(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (!origin || !host) return false
  const expectedOrigin = `${request.nextUrl.protocol}${host}`
  return origin.toLowerCase() === expectedOrigin.toLowerCase()
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isCsrfValid(request)) {
    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
  }

  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
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
