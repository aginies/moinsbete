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

async function verifyTurnstile(token: string, remoteIp: string): Promise<boolean> {
  if (!process.env.TURNSTILE_SECRET_KEY) {
    return true
  }

  // Development bypass for testing keys when offline/behind proxy
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.TURNSTILE_SECRET_KEY === '0x4AAAAAAD329wA3uz-RrH8FJ80KzMltOSA' &&
    !token
  ) {
    console.log('DEVELOPMENT BYPASS: Empty token allowed for Cloudflare Turnstile testing keys.')
    return true
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
    console.log('TURNSTILE response:', data)
    return data.success === true
  } catch {
    return false
  }
}

export async function isRegistrationLocked() {
  return process.env.REGISTRATION_LOCKED === 'true'
}

export async function getTurnstileSiteKey() {
  console.log("SERVER SITE KEY VALUE:", process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
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

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: 'Cet email est déjà utilisé' }
  }

  const isTestingKey = process.env.TURNSTILE_SECRET_KEY === '0x4AAAAAAD329wA3uz-RrH8FJ80KzMltOSA'
  const isDevEmptyToken = process.env.NODE_ENV === 'development' && isTestingKey && !cfToken

  if (process.env.TURNSTILE_SECRET_KEY && !cfToken && !isDevEmptyToken) {
    return { error: 'Vérification humaine requise.' }
  }

  if (process.env.TURNSTILE_SECRET_KEY && cfToken) {
    const remoteIp = await getClientIpFromHeaders()
    const turnstileSuccess = await verifyTurnstile(cfToken, remoteIp)
    if (!turnstileSuccess) {
      return { error: 'Vérification humaine échouée. Réessayez.' }
    }
  }

  if (isDevEmptyToken) {
    console.log('DEVELOPMENT BYPASS: Empty token allowed for Cloudflare Turnstile testing keys.')
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

  // Set session cookies (both secure and non-secure for maximum compatibility on HTTP and HTTPS)
  const cookieStore = await cookies()
  const cookieExpires = new Date()
  cookieExpires.setTime(cookieExpires.getTime() + SESSION_COOKIE_MAX_AGE_MS)

  // 1. Non-secure cookie for HTTP
  cookieStore.set('next-auth.session-token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: false,
    expires: cookieExpires,
  })

  // 2. Secure cookie for HTTPS
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
  
  // Clear non-secure cookie
  cookieStore.set('next-auth.session-token', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    expires: pastDate,
  })
  
  // Clear secure cookie
  cookieStore.set('__Secure-next-auth.session-token', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    expires: pastDate,
  })
  
  return { success: true }
}

export async function changePasswordAction(formData: FormData) {
  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string

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
