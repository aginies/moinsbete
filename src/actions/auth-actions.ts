'use server'

import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { encode, decode } from 'next-auth/jwt'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { headers } from 'next/headers'
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_REGISTER_MAX, RATE_LIMIT_LOGIN_MAX, SESSION_COOKIE_MAX_AGE_MS, SESSION_MAX_AGE_SECONDS, MIN_PASSWORD_LENGTH } from '@/lib/constants'
import { getClientIpFromHeaders } from '@/lib/ip'

export async function isRegistrationLocked() {
  return process.env.REGISTRATION_LOCKED === 'true'
}

export async function registerAction(formData: {
  email: string
  password: string
  displayName: string
}) {
  const { email, password, displayName } = formData

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

  // Set session cookie
  const cookieStore = await cookies()
  const cookieName = process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token'
  const cookieExpires = new Date()
  cookieExpires.setTime(cookieExpires.getTime() + SESSION_COOKIE_MAX_AGE_MS)

  cookieStore.set(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    expires: cookieExpires,
  })

  return { success: true }
}

export async function logoutAction(formData?: FormData) {
  const cookieStore = await cookies()
  const cookieName = process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token'
  
  cookieStore.delete(cookieName)
  
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
