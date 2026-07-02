import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

function isCsrfValid(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (!origin || !host) return false
  const expectedOrigin = `${request.nextUrl.protocol}${host}`
  return origin.toLowerCase() === expectedOrigin.toLowerCase()
}

export async function POST(request: NextRequest) {
  if (!isCsrfValid(request)) {
    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
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

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const resetLink = `${baseUrl}/reset-password/${token}`

    return NextResponse.json({
      success: true,
      resetLink,
    })
  } catch (error) {
    console.error('Reset token error:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
