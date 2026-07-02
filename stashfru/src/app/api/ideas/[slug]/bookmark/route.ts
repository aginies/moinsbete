import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

import { getSession, authOptions } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSession()
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
      const existing = await prisma.bookmark.findUnique({
        where: {
          userId_ideaId: {
            userId: session.user.id,
            ideaId: idea.id,
          },
        },
      })

      if (existing) {
        await prisma.bookmark.delete({
          where: { id: existing.id },
        })
        return NextResponse.json({ bookmarked: false })
      }

      await prisma.bookmark.create({
        data: {
          userId: session.user.id,
          ideaId: idea.id,
        },
      })

      return NextResponse.json({ bookmarked: true })
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
  } catch (error) {
    console.error('Bookmark error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
