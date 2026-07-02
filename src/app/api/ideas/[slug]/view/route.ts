import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

function isCsrfValid(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (!origin || !host) return false
  const expectedOrigin = `${request.nextUrl.protocol}${host}`
  return origin.toLowerCase() === expectedOrigin.toLowerCase()
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isCsrfValid(request)) {
    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
  }
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const { slug } = await params
    const ideaId = await request.json().then(json => json.userId)
    const userIdToUse = ideaId || session.user.id

    // Vérifier que l'idée existe
    const idea = await prisma.idea.findUnique({ where: { slug } })
    if (!idea) {
      return NextResponse.json({ error: 'Idée introuvable' }, { status: 404 })
    }

    // Créer ou mettre à jour la vue (upsert)
    await prisma.viewedIdea.upsert({
      where: {
        userId_ideaId: {
          userId: userIdToUse,
          ideaId: idea.id,
        },
      },
      create: {
        userId: userIdToUse,
        ideaId: idea.id,
      },
      update: {},
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('View error:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
