import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createSuggestionAction } from '@/actions/suggestion-actions'
import { isCsrfValid } from '@/lib/csrf'

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const masked = local.length > 2 ? local[0] + '***' : local.slice(0, 1) + '*'
  return `${masked}@${domain}`
}

export async function GET() {
  const suggestions = await prisma.userSuggestion.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { comments: true } },
      user: { select: { id: true, displayName: true, email: true } },
    },
  })

  const maskedSuggestions = suggestions.map(s => ({
    ...s,
    user: { ...s.user, email: maskEmail(s.user.email) },
  }))

  return NextResponse.json({ suggestions: maskedSuggestions })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  if (!(await isCsrfValid(req))) {
    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
  }

  const body = await req.json()
  const result = await createSuggestionAction(body)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json(result)
}
