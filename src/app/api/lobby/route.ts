import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createSuggestionAction } from '@/actions/suggestion-actions'

export async function GET() {
  const suggestions = await prisma.userSuggestion.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { comments: true } },
      user: { select: { id: true, displayName: true, email: true } },
    },
  })

  return NextResponse.json({ suggestions })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json()
  const result = await createSuggestionAction(body)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json(result)
}
