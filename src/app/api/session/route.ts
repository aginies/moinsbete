import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'

export async function GET() {
  const session = await getSession()
  
  if (!session?.user) {
    return NextResponse.json({ user: null })
  }

  if (!(await checkRateLimit(`session:${session.user.id}`, 60, 60_000))) {
    return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
  }

  return NextResponse.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
  })
}
