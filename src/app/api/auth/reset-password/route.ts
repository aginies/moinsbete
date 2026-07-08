import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { isCsrfValid } from '@/lib/csrf'
import { checkRateLimit } from '@/lib/rate-limiter'
import { RATE_LIMIT_RESET_MAX, RATE_LIMIT_RESET_WINDOW_MS, MIN_PASSWORD_LENGTH } from '@/lib/constants'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  if (!(await isCsrfValid(request))) {
    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
  }

  const headersList = await headers()
  const rawIp = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  const clientId = rawIp.split(',')[0].trim()
  if (!checkRateLimit(`reset:${clientId}`, RATE_LIMIT_RESET_MAX, RATE_LIMIT_RESET_WINDOW_MS)) {
    return NextResponse.json({ error: 'Trop de demandes. Réessayez dans 5 minutes.' }, { status: 429 })
  }

  try {
    const { token, newPassword } = await request.json()

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token et mot de passe requis' }, { status: 400 })
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères` }, { status: 400 })
    }

    if (newPassword.length > 128) {
      return NextResponse.json({ error: 'Le mot de passe est trop long' }, { status: 400 })
    }

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 400 })
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Token expiré' }, { status: 400 })
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12)

    // Update user password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    })

    // Delete used token
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
