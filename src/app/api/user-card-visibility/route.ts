import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      console.warn('[API/user-card-visibility] GET: Non authentifié. No active session found.')
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    }

    const field = request.nextUrl.searchParams.get('field')

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        wikipediaImageCardVisible: true,
        saviezVousCardVisible: true,
        radioFranceCardVisible: true,
        imageWikimediaCardVisible: true,
        imageWikimediaShowCategories: true,
        imagePixabayCardVisible: true,
        imagePixabayShowCategories: true,
        imageWikiLovesShowCategories: true,
        portailLexicalCardVisible: true,
        proverbeCardVisible: true,
        cnrsNewsEnabled: true,
      },
    })

    if (!user) {
      console.error(`[API/user-card-visibility] GET: User not found in database for ID: ${session.user.id}`)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (field && field in user) {
      return NextResponse.json({ [field]: user[field as keyof typeof user] })
    }

    return NextResponse.json(user)
  } catch (err: any) {
    console.error('[API/user-card-visibility] GET uncaught error:', err)
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      console.warn('[API/user-card-visibility] POST: Non authentifié. No active session found.')
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    }

    const csrfToken = request.headers.get('x-csrf-token')
    if (!csrfToken) {
      console.warn(`[API/user-card-visibility] POST: CSRF token missing for user ${session.user.id}`)
      return NextResponse.json({ error: 'CSRF token missing' }, { status: 403 })
    }

    const userId = session.user.id
    if (!(await checkRateLimit(`visibility:${userId}`, 30, 60_000))) {
      console.warn(`[API/user-card-visibility] POST: Rate limit exceeded for user ${userId}`)
      return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
    }

    const body = await request.json()
    const { field, value } = body

    const validFields = [
      'wikipediaImageCardVisible',
      'saviezVousCardVisible',
      'radioFranceCardVisible',
      'imageWikimediaCardVisible',
      'imageWikimediaShowCategories',
      'imagePixabayCardVisible',
      'imagePixabayShowCategories',
      'imageWikiLovesCardVisible',
      'imageWikiLovesShowCategories',
      'portailLexicalCardVisible',
      'proverbeCardVisible',
      'cnrsNewsEnabled',
    ]

    if (!validFields.includes(field)) {
      console.error(`[API/user-card-visibility] POST: Invalid field: ${field}`)
      return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { [field]: value },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[API/user-card-visibility] POST uncaught error:', err)
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 })
  }
}
