import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'
import { isCsrfValid } from '@/lib/csrf'
import { checkRateLimit } from '@/lib/rate-limiter'
import { RATE_LIMIT_RESET_GENERATE_MAX, RATE_LIMIT_RESET_GENERATE_WINDOW_MS, RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'
import { getClientIp } from '@/lib/ip'
import { sendResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  if (!(await isCsrfValid(request))) {
    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
  }

  const clientId = getClientIp(request)
  if (!checkRateLimit(`reset-generate:${clientId}`, RATE_LIMIT_RESET_GENERATE_MAX, RATE_LIMIT_RESET_GENERATE_WINDOW_MS)) {
    return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
  }

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ success: true })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 3600000)

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    })

    await prisma.passwordResetToken.create({
      data: {
        token,
        email: user.email,
        userId: user.id,
        expiresAt,
      },
    })

    await sendResetEmail(user.email, token).catch((err) => {
      console.error('Email send failed:', err)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset token error:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
