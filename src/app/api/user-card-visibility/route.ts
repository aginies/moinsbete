import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) {
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
      imageWikiLovesCardVisible: true,
      imageWikiLovesShowCategories: true,
      cnrsNewsEnabled: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (field && field in user) {
    return NextResponse.json({ [field]: user[field as keyof typeof user] })
  }

  return NextResponse.json(user)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
  }

  const csrfToken = request.headers.get('x-csrf-token')
  if (!csrfToken) {
    return NextResponse.json({ error: 'CSRF token missing' }, { status: 403 })
  }

  const userId = session.user.id
  if (!(await checkRateLimit(`visibility:${userId}`, 30, 60_000))) {
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
    'cnrsNewsEnabled',
  ]

  if (!validFields.includes(field)) {
    return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { [field]: value },
  })

  return NextResponse.json({ success: true })
}
