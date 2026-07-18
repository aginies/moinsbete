import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { addCommentAction, updateSuggestionAction, deleteSuggestionAction } from '@/actions/suggestion-actions'
import { isCsrfValid } from '@/lib/csrf'

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const masked = local.length > 2 ? local[0] + '***' : local.slice(0, 1) + '*'
  return `${masked}@${domain}`
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const suggestion = await prisma.userSuggestion.findUnique({
    where: { id: (await params).id },
    include: {
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, displayName: true, email: true } },
        },
      },
      user: { select: { id: true, displayName: true, email: true } },
    },
  })

  if (!suggestion) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const maskedSuggestion = {
    ...suggestion,
    user: { ...suggestion.user, email: maskEmail(suggestion.user.email) },
    comments: suggestion.comments.map(c => ({
      ...c,
      user: { ...c.user, email: maskEmail(c.user.email) },
    })),
  }

  return NextResponse.json({ suggestion: maskedSuggestion })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  if (!(await isCsrfValid(req))) {
    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
  }

  const body = await req.json()
  if (!body?.content) {
    return NextResponse.json({ error: 'Contenu requis' }, { status: 400 })
  }
  const result = await addCommentAction({ suggestionId: (await params).id, content: body.content })
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json(result)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  if (!(await isCsrfValid(req))) {
    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
  }

  const body = await req.json()
  if (!body?.title || !body?.description) {
    return NextResponse.json({ error: 'Titre et description requis' }, { status: 400 })
  }
  const result = await updateSuggestionAction((await params).id, body)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json(result)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const result = await deleteSuggestionAction((await params).id)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ success: true })
}
