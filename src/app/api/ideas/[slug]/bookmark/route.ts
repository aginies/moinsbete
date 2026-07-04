import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionWithCookies } from '@/lib/auth'
import { isCsrfValid } from '@/lib/csrf'
import { toggleBookmark } from '@/lib/bookmark'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isCsrfValid(request)) {
    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
  }
  const session = await getSessionWithCookies(await cookies())
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { slug } = await params
  const { action } = await request.json()

  const idea = await prisma.idea.findUnique({
    where: { slug },
  })

  if (!idea) {
    return NextResponse.json({ error: 'Idée introuvable' }, { status: 404 })
  }

  if (action === 'bookmark') {
    const result = await toggleBookmark(session.user.id, idea.id)
    return NextResponse.json(result)
  }

  return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
}
