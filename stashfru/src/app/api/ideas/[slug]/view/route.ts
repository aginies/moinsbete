import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    // Vérifier que l'idée existe
    const idea = await prisma.idea.findUnique({ where: { slug } })
    if (!idea) {
      return NextResponse.json({ error: 'Idée introuvable' }, { status: 404 })
    }

    // Créer ou mettre à jour la vue (upsert)
    await prisma.viewedIdea.upsert({
      where: {
        userId_ideaId: {
          userId,
          ideaId: idea.id,
        },
      },
      create: {
        userId,
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
