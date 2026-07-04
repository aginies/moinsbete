import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionWithCookies } from '@/lib/auth'
import { isCsrfValid } from '@/lib/csrf'
import { markIdeaViewed } from '@/lib/view'
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

  try {
    const { slug } = await params

    const idea = await prisma.idea.findUnique({ where: { slug } })
    if (!idea) {
      return NextResponse.json({ error: 'Idée introuvable' }, { status: 404 })
    }

    await markIdeaViewed(session.user.id, idea.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('View error:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
