import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'

const DEFAULT_ORDER = [
  'saviezVous', 'wikipedia', 'cnrs', 'radioFrance',
  'wikimedia', 'wikiloves', 'pixabay', 'portailLexical', 'proverbe'
]

export async function GET() {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { cardOrder: true },
  })
  const cardOrder = user?.cardOrder
  const order = typeof cardOrder === 'string' ? JSON.parse(cardOrder) : cardOrder
  return NextResponse.json({ order: order ?? DEFAULT_ORDER })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
  }
  const userId = session.user.id
  if (!(await checkRateLimit(`card-order:${userId}`, 10, 60_000))) {
    return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
  }
  const body = await request.json()
  const { order } = body
  if (!Array.isArray(order) || order.length === 0) {
    return NextResponse.json({ error: 'Invalid order' }, { status: 400 })
  }
  await prisma.user.update({
    where: { id: session.user.id },
    data: { cardOrder: order },
  })
  return NextResponse.json({ success: true })
}
