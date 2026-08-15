'use server'

import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { encode } from 'next-auth/jwt'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_REGISTER_MAX, RATE_LIMIT_LOGIN_MAX, SESSION_COOKIE_MAX_AGE_MS, SESSION_MAX_AGE_SECONDS, MIN_PASSWORD_LENGTH } from '@/lib/constants'
import { getClientIpFromHeaders } from '@/lib/ip'
import { isValidEmail } from '@/lib/utils'

async function verifyTurnstile(token: string, remoteIp: string): Promise<boolean> {
  if (!process.env.TURNSTILE_SECRET_KEY) {
    return false
  }

  try {
    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: remoteIp,
      }),
    })

    const data = await result.json()
    return data.success === true
  } catch {
    return false
  }
}

export async function isRegistrationLocked() {
  return process.env.REGISTRATION_LOCKED === 'true'
}

export async function getTurnstileSiteKey() {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''
}

export async function registerAction(formData: {
  email: string
  password: string
  displayName: string
  cfToken?: string
}) {
  const { email, password, displayName, cfToken } = formData

  const clientId = await getClientIpFromHeaders()
  if (!(await checkRateLimit(`register:${clientId}`, RATE_LIMIT_REGISTER_MAX, RATE_LIMIT_WINDOW_MS))) {
    return { error: 'Trop de tentatives. Réessayez dans 60 secondes.' }
  }

  if (process.env.REGISTRATION_LOCKED === 'true') {
    return { error: 'Inscriptions temporairement fermées pendant la mise à jour de la base de données.' }
  }

  if (!isValidEmail(email)) {
    return { error: 'Adresse email invalide' }
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères` }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: 'Cet email est déjà utilisé' }
  }

  if (process.env.CAPACITOR !== 'true' && process.env.TURNSTILE_SECRET_KEY && !cfToken) {
    return { error: 'Vérification humaine requise.' }
  }

  if (process.env.CAPACITOR !== 'true' && process.env.TURNSTILE_SECRET_KEY && cfToken) {
    const remoteIp = await getClientIpFromHeaders()
    const turnstileSuccess = await verifyTurnstile(cfToken, remoteIp)
    if (!turnstileSuccess) {
      return { error: 'Vérification humaine échouée. Réessayez.' }
    }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName,
    },
  })

  return { success: true }
}

export async function loginAction(formData: {
  email: string
  password: string
}) {
  const clientId = await getClientIpFromHeaders()
  if (!(await checkRateLimit(`login:${clientId}`, RATE_LIMIT_LOGIN_MAX, RATE_LIMIT_WINDOW_MS))) {
    return { error: 'Trop de tentatives. Réessayez dans 60 secondes.' }
  }

  const user = await prisma.user.findUnique({ where: { email: formData.email } })

  // Timing-constant: always run bcrypt.compare
  const defaultHash = '$2a$12$' + '0'.repeat(53)
  const compareHash = user?.passwordHash ?? defaultHash
  const isValid = await bcrypt.compare(formData.password, compareHash)

  if (!isValid) {
    return { error: 'Email ou mot de passe incorrect' }
  }

  if (!user?.enabled) {
    return { error: 'Compte désactivé' }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  })

  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    return { error: 'Erreur de configuration serveur' }
  }

  // Create JWT token (user is guaranteed to exist since isValid is true)
  const token = await encode({
    token: {
      id: user!.id,
      name: user!.displayName,
      email: user!.email,
      picture: undefined,
      sub: user!.id,
    },
    secret,
    maxAge: SESSION_MAX_AGE_SECONDS,
  })

  // Set secure session cookie
  const cookieStore = await cookies()
  const cookieExpires = new Date()
  cookieExpires.setTime(cookieExpires.getTime() + SESSION_COOKIE_MAX_AGE_MS)

  cookieStore.set('__Secure-next-auth.session-token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: true,
    expires: cookieExpires,
  })

  return { success: true }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  const pastDate = new Date('1970-01-01T00:00:00Z')
  
  // Clear secure cookie
  cookieStore.set('__Secure-next-auth.session-token', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    expires: pastDate,
  })
  
  // Clear standard session cookie
  cookieStore.set('next-auth.session-token', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    expires: pastDate,
  })

  return { success: true }
}

export async function toggleEmailNotificationsAction(enabled: boolean) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { error: 'Non authentifié' }

  await prisma.user.update({
    where: { id: session.user.id as string },
    data: { emailNotificationsEnabled: enabled },
  })

  return { success: true }
}

export async function changePasswordAction(formData: FormData) {
  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (newPassword !== confirmPassword) {
    return { error: 'Les mots de passe ne correspondent pas' }
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return { error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères` }
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { error: 'Non connecté' }
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id as string } })
  if (!user) {
    return { error: 'Utilisateur non trouvé' }
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!isValid) {
    return { error: 'Mot de passe actuel incorrect' }
  }

  const newHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  })

  return { success: true }
}
